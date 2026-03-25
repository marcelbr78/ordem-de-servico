import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { OrderConversation, MessageDirection, MessageChannel } from './entities/order-conversation.entity';
import { OrderService as OS, OSStatus } from './entities/order-service.entity';

@Injectable()
export class ConversationService {
    private readonly logger = new Logger(ConversationService.name);

    constructor(
        @InjectRepository(OrderConversation)
        private convRepo: Repository<OrderConversation>,
        @InjectRepository(OS)
        private orderRepo: Repository<OS>,
        private dataSource: DataSource,
    ) {}

    // ── Registrar mensagem enviada pela loja ──────────────────
    async recordOutbound(params: {
        orderId: string;
        tenantId?: string;
        content: string;
        channel?: MessageChannel;
        userId?: string;
        senderName?: string;
    }): Promise<OrderConversation> {
        const msg = this.convRepo.create({
            orderId: params.orderId,
            tenantId: params.tenantId,
            direction: MessageDirection.OUTBOUND,
            channel: params.channel || MessageChannel.WHATSAPP,
            content: params.content,
            userId: params.userId,
            senderName: params.senderName || 'Sistema',
            delivered: false,
        });
        return this.convRepo.save(msg);
    }

    // ── Registrar mensagem recebida do cliente ────────────────
    async recordInbound(params: {
        remoteJid: string;   // JID completo: pode ser @s.whatsapp.net ou @lid
        pushName?: string;   // Nome exibido no WhatsApp
        content: string;
        channel?: MessageChannel;
        externalId?: string;
    }): Promise<OrderConversation | null> {
        // Evitar duplicatas pelo externalId
        if (params.externalId) {
            const exists = await this.convRepo.findOne({ where: { externalId: params.externalId } });
            if (exists) return null;
        }

        const order = await this.findActiveOrder(params.remoteJid, params.pushName);
        if (!order) {
            this.logger.debug(`[Conversation] Sem OS ativa para JID ${params.remoteJid} / pushName ${params.pushName || '-'}`);
            return null;
        }

        const cleanPhone = params.remoteJid.replace(/@\S+/g, '').replace(/\D/g, '');
        const msg = this.convRepo.create({
            orderId: order.id,
            tenantId: (order as any).tenantId,
            direction: MessageDirection.INBOUND,
            channel: params.channel || MessageChannel.WHATSAPP,
            content: params.content,
            senderPhone: cleanPhone,
            senderName: (order as any).client?.nome || params.pushName || cleanPhone,
            externalId: params.externalId,
        });

        const saved = await this.convRepo.save(msg);
        this.logger.log(`[Conversation] Mensagem do cliente gravada: OS ${order.id}`);
        return saved;
    }

    // ── Registrar mensagem manual enviada direto pelo WhatsApp ─
    async recordManualOutbound(params: {
        remoteJid: string;   // JID completo
        pushName?: string;
        content: string;
        externalId?: string;
        channel?: MessageChannel;
    }): Promise<OrderConversation | null> {
        // Evitar duplicatas
        if (params.externalId) {
            const exists = await this.convRepo.findOne({ where: { externalId: params.externalId } });
            if (exists) return null;
        }

        const order = await this.findActiveOrder(params.remoteJid, params.pushName);
        if (!order) return null;

        const msg = this.convRepo.create({
            orderId: order.id,
            tenantId: (order as any).tenantId,
            direction: MessageDirection.OUTBOUND,
            channel: params.channel || MessageChannel.WHATSAPP,
            content: params.content,
            senderName: 'Loja (WhatsApp)',
            externalId: params.externalId,
            delivered: true,
        });

        const saved = await this.convRepo.save(msg);
        this.logger.log(`[Conversation] Mensagem manual da loja gravada: OS ${order.id}`);
        return saved;
    }

    // ── Buscar OS ativa pelo JID (suporta @s.whatsapp.net E @lid) ─
    private async findActiveOrder(remoteJid: string, pushName?: string): Promise<OS | null> {
        const activeStatuses = [
            OSStatus.ABERTA, OSStatus.EM_DIAGNOSTICO, OSStatus.AGUARDANDO_APROVACAO,
            OSStatus.AGUARDANDO_PECA, OSStatus.EM_REPARO, OSStatus.TESTES,
            OSStatus.FINALIZADA, OSStatus.ENTREGUE,
        ];
        const isLid = remoteJid.includes('@lid');
        const cleanId = remoteJid.replace(/@\S+/g, '').replace(/\D/g, '');

        // ── 1. Busca por JID salvo (funciona para @lid e @s.whatsapp.net) ──
        const byJid = await this.dataSource.query(`
            SELECT os.id, cc.id as "contactId"
            FROM order_services os
            INNER JOIN clients c ON c.id = os."clientId"
            INNER JOIN clientes_contatos cc ON cc."clienteId" = c.id
            WHERE os."deletedAt" IS NULL
              AND os.status = ANY($1)
              AND cc."whatsappJid" = $2
            ORDER BY os."entryDate" DESC LIMIT 1
        `, [activeStatuses, remoteJid]).catch(() => []);

        if (byJid.length) {
            return this.orderRepo.findOne({ where: { id: byJid[0].id }, relations: ['client'] });
        }

        // ── 2. Busca por telefone (apenas para @s.whatsapp.net) ──────────
        if (!isLid && cleanId.length >= 8) {
            const byPhone = await this.dataSource.query(`
                SELECT os.id, cc.id as "contactId"
                FROM order_services os
                INNER JOIN clients c ON c.id = os."clientId"
                INNER JOIN clientes_contatos cc ON cc."clienteId" = c.id
                WHERE os."deletedAt" IS NULL
                  AND os.status = ANY($1)
                  AND (
                    REGEXP_REPLACE(cc.numero, '[^0-9]', '', 'g') LIKE $2
                    OR $3 LIKE '%' || REGEXP_REPLACE(cc.numero, '[^0-9]', '', 'g') || '%'
                  )
                ORDER BY os."entryDate" DESC LIMIT 1
            `, [activeStatuses, `%${cleanId.slice(-8)}%`, cleanId]).catch((err) => {
                this.logger.error(`[Conversation] Erro query telefone: ${err?.message}`);
                return [];
            });

            if (byPhone.length) {
                await this.saveJid(byPhone[0].contactId, remoteJid);
                return this.orderRepo.findOne({ where: { id: byPhone[0].id }, relations: ['client'] });
            }
        }

        // ── 3. Busca por nome (fallback para @lid sem mapeamento ainda) ──
        // Estratégia: verifica se o pushName do WhatsApp contém o primeiro ou segundo nome do cliente
        // Ex: pushName="Infosend Apple (marcel)" e nome="Marcel souza" → match por "marcel"
        if (pushName && pushName.trim().length >= 3) {
            const byName = await this.dataSource.query(`
                SELECT os.id, cc.id as "contactId"
                FROM order_services os
                INNER JOIN clients c ON c.id = os."clientId"
                INNER JOIN clientes_contatos cc ON cc."clienteId" = c.id
                WHERE os."deletedAt" IS NULL
                  AND os.status = ANY($1)
                  AND (
                    $2 ILIKE '%' || split_part(c.nome, ' ', 1) || '%'
                    OR $2 ILIKE '%' || split_part(c.nome, ' ', 2) || '%'
                    OR c.nome ILIKE '%' || split_part($2, ' ', 1) || '%'
                  )
                ORDER BY os."entryDate" DESC LIMIT 1
            `, [activeStatuses, pushName]).catch((err) => {
                this.logger.error(`[Conversation] Erro query nome: ${err?.message}`);
                return [];
            });

            if (byName.length) {
                this.logger.log(`[Conversation] JID ${remoteJid} vinculado por pushName "${pushName}"`);
                await this.saveJid(byName[0].contactId, remoteJid);
                return this.orderRepo.findOne({ where: { id: byName[0].id }, relations: ['client'] });
            }
        }

        return null;
    }

    // ── Salvar JID no contato para lookup futuro ──────────────
    private async saveJid(contactId: string, jid: string): Promise<void> {
        await this.dataSource.query(
            `UPDATE clientes_contatos SET "whatsappJid" = $1 WHERE id = $2 AND ("whatsappJid" IS NULL OR "whatsappJid" != $1)`,
            [jid, contactId],
        ).catch(() => {}); // não crítico
    }

    // ── Listar conversa de uma OS ─────────────────────────────
    async getConversation(orderId: string): Promise<OrderConversation[]> {
        return this.convRepo.find({
            where: { orderId },
            order: { createdAt: 'ASC' },
        });
    }

    // ── Estatísticas de conversa ──────────────────────────────
    async getStats(orderId: string) {
        const msgs = await this.getConversation(orderId);
        const outbound = msgs.filter(m => m.direction === MessageDirection.OUTBOUND);
        const inbound = msgs.filter(m => m.direction === MessageDirection.INBOUND);
        return {
            total: msgs.length,
            outbound: outbound.length,
            inbound: inbound.length,
            lastMessage: msgs[msgs.length - 1] || null,
        };
    }

    // ── Migrar mensagens existentes do order_history ──────────
    async migrateFromHistory(orderId: string): Promise<void> {
        const existing = await this.convRepo.count({ where: { orderId } });
        if (existing > 0) return;

        const rows = await this.dataSource.query(`
            SELECT * FROM order_history
            WHERE "orderId" = $1 AND "waMsgSent" = true AND "waMsgContent" IS NOT NULL
            ORDER BY "createdAt" ASC
        `, [orderId]).catch(() => []);

        for (const row of rows) {
            await this.convRepo.save(this.convRepo.create({
                orderId,
                tenantId: row.tenantId,
                direction: MessageDirection.OUTBOUND,
                channel: MessageChannel.WHATSAPP,
                content: row.waMsgContent,
                userId: row.userId,
                senderName: 'Sistema (migrado)',
                createdAt: row.createdAt,
            }));
        }
    }
}
