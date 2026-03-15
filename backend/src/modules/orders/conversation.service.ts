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
        clientPhone: string;
        content: string;
        channel?: MessageChannel;
        externalId?: string;
    }): Promise<OrderConversation | null> {
        // Encontrar OS ativa pelo telefone do cliente
        const cleanPhone = params.clientPhone.replace(/\D/g, '');
        const order = await this.findActiveOrderByPhone(cleanPhone);

        if (!order) {
            this.logger.debug(`[Conversation] Sem OS ativa para telefone ${cleanPhone}`);
            return null;
        }

        const msg = this.convRepo.create({
            orderId: order.id,
            tenantId: (order as any).tenantId,
            direction: MessageDirection.INBOUND,
            channel: params.channel || MessageChannel.WHATSAPP,
            content: params.content,
            senderPhone: cleanPhone,
            senderName: (order as any).client?.nome || cleanPhone,
            externalId: params.externalId,
        });

        const saved = await this.convRepo.save(msg);
        this.logger.log(`[Conversation] Mensagem do cliente gravada: OS ${order.id}`);
        return saved;
    }

    // ── Buscar OS ativa pelo telefone do cliente ──────────────
    private async findActiveOrderByPhone(cleanPhone: string): Promise<OS | null> {
        // Buscar OS abertas/em andamento cujo cliente tem esse número
        const activeStatuses = [
            OSStatus.ABERTA, OSStatus.EM_DIAGNOSTICO, OSStatus.AGUARDANDO_APROVACAO,
            OSStatus.AGUARDANDO_PECA, OSStatus.EM_REPARO, OSStatus.TESTES, OSStatus.FINALIZADA,
        ];

        // Query via DataSource pois precisa cruzar clients e contacts
        const rows = await this.dataSource.query(`
            SELECT os.id, os."tenantId"
            FROM order_services os
            INNER JOIN clients c ON c.id = os."clientId"
            INNER JOIN client_contacts cc ON cc."clientId" = c.id
            WHERE os."deletedAt" IS NULL
              AND os.status = ANY($1)
              AND (
                REGEXP_REPLACE(cc.numero, '[^0-9]', '', 'g') LIKE $2
                OR $3 LIKE '%' || REGEXP_REPLACE(cc.numero, '[^0-9]', '', 'g') || '%'
              )
            ORDER BY os."entryDate" DESC
            LIMIT 1
        `, [activeStatuses, `%${cleanPhone.slice(-8)}%`, cleanPhone]).catch(() => []);

        if (!rows.length) return null;

        return this.orderRepo.findOne({
            where: { id: rows[0].id },
            relations: ['client'],
        });
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
        if (existing > 0) return; // já migrado

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
