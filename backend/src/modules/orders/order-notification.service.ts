import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Repository } from 'typeorm';
import { OrderService } from './entities/order-service.entity';
import { OrderHistory, HistoryActionType } from './entities/order-history.entity';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { SettingsService } from '../settings/settings.service';
import { ConversationService } from './conversation.service';

/**
 * Dados de mensagem já resolvidos pelo chamador — sem lógica de domínio aqui.
 * O chamador (OrdersService) determina title, description e buttons com base
 * no estado da OS antes de invocar este service.
 */
export interface OrderMessagePayload {
    targetNumber?: string;       // se omitido, resolve do cliente
    customMessage?: string;      // mensagem livre — se presente, ignora template
    title: string;
    description: string;
    buttons: Array<{ type: string; displayText: string; url: string }>;
    storeName: string;
    tenantId?: string;
}

export interface ShareOrderOptions {
    type: 'entry' | 'exit' | 'update';
    origin?: string;
    customNumber?: string;
    userId?: string;
    message?: string;
    tenantId?: string;
    /** resolvido pelo chamador — não calculado aqui */
    addApprovalButtons?: boolean;
    approvalStorePhone?: string;
}

@Injectable()
export class OrderNotificationService {
    constructor(
        @InjectRepository(OrderHistory)
        private historyRepository: Repository<OrderHistory>,
        private dataSource: DataSource,
        private whatsappService: WhatsappService,
        private settingsService: SettingsService,
        private conversationService: ConversationService,
    ) {}

    // ─── Notificação de criação (fluxo independente) ────────────────────────

    async notifyOnCreate(client: any, order: OrderService): Promise<void> {
        if (!client?.contatos) return;

        const contact = client.contatos.find(c => c.tipo === 'whatsapp' && c.principal)
            || client.contatos.find(c => c.tipo === 'whatsapp')
            || client.contatos.find(c => c.principal && c.numero)
            || client.contatos.find(c => c.numero);

        if (!contact?.numero) return;

        try {
            const device = order.equipments?.[0]
                ? `${order.equipments[0].type} ${order.equipments[0].model}`
                : 'seu equipamento';

            const settings = await this.settingsService.findAll();
            const publicUrl = settings.find(s => s.key === 'company_url')?.value || '';
            const frontendUrl = publicUrl || process.env.FRONTEND_URL || 'https://os4u.com.br';
            const statusUrl = `${frontendUrl.replace(/\/+$/, '')}/status/${order.id}`;

            await this.whatsappService.sendOSCreated(contact.numero, order.protocol, device, statusUrl);
            console.log(`[WhatsApp] Notificação de criação enviada para ${contact.numero} — OS ${order.protocol}`);
        } catch (error) {
            console.error(`[WhatsApp] Falha na notificação de criação para OS ${order.protocol}:`, error);
        }
    }

    // ─── Notificação de compartilhamento (acionada manualmente) ────────────

    async notifyOrderShare(
        order: OrderService,
        options: ShareOrderOptions,
    ): Promise<{ success: boolean; message?: string }> {
        const { type, origin, customNumber, userId, message: customMessage, tenantId } = options;
        console.log(`[WhatsApp Share] OS: ${order.id}, tipo: ${type}, mensagem livre: ${!!customMessage}`);

        // ── 1. Resolver número destino ──────────────────────────────────────
        let targetNumber = customNumber;
        if (!targetNumber) {
            const contact = order.client?.contatos?.find(c => c.tipo === 'whatsapp' && c.principal && c.numero)
                || order.client?.contatos?.find(c => c.tipo === 'whatsapp' && c.numero)
                || order.client?.contatos?.find(c => c.principal && c.numero)
                || order.client?.contatos?.find(c => c.numero);
            targetNumber = contact?.numero;
        }

        if (!targetNumber) {
            throw new BadRequestException('Cliente sem telefone cadastrado e nenhum n\u00famero informado.');
        }

        targetNumber = targetNumber.replace(/\D/g, '');
        if (targetNumber.length >= 10 && targetNumber.length <= 11) {
            targetNumber = '55' + targetNumber;
        }

        // ── 2. Verificar WhatsApp configurado ───────────────────────────────
        const configStatus = await this.whatsappService.getConfigStatus(tenantId);
        if (!configStatus.configured || !configStatus.hasInstance) {
            throw new BadRequestException('WhatsApp n\u00e3o configurado no sistema.');
        }

        // ── 3. Buscar configurações da loja ─────────────────────────────────
        const settings = await this.settingsService.findAll();
        const storeName = settings.find(s => s.key === 'store_name' || s.key === 'company_name')?.value || 'Nossa Loja';
        const publicUrl = settings.find(s => s.key === 'company_url')?.value || '';
        const clientName = (order.client?.nome || 'Cliente').split(' ')[0];
        const device = order.equipments?.[0]
            ? `${order.equipments[0].type} ${order.equipments[0].model}`
            : 'seu equipamento';

        // ── 4. Montar e enviar mensagem ─────────────────────────────────────
        const finalMessage = customMessage?.trim() || '';

        if (finalMessage) {
            await this.whatsappService.sendMessage(targetNumber, finalMessage, tenantId);
        } else {
            const payload = this._buildMessagePayload({
                type,
                order,
                options,
                clientName,
                device,
                storeName,
                publicUrl,
            });
            await this.whatsappService.sendButtons(
                targetNumber,
                payload.title,
                payload.description,
                payload.buttons,
                storeName,
                tenantId,
            );
        }

        // ── 5. Audit log (transação isolada, após envio) ────────────────────
        await this._recordAuditLog(order.id, order.status, finalMessage, type, userId);

        // ── 6. Gravar na conversa ───────────────────────────────────────────
        try {
            await this.conversationService.recordOutbound({
                orderId: order.id,
                tenantId: (order as any).tenantId,
                content: finalMessage || `[Mensagem autom\u00e1tica - tipo: ${type}]`,
                userId,
                senderName: 'Sistema',
            });
        } catch (e) {
            console.warn(`[Conversation] Falha ao gravar outbound: ${e?.message}`);
        }

        return { success: true, message: 'Mensagem enviada com sucesso!' };
    }

    // ─── Helpers privados — sem acesso ao repositório de OS ────────────────

    private _buildMessagePayload(ctx: {
        type: ShareOrderOptions['type'];
        order: OrderService;
        options: ShareOrderOptions;
        clientName: string;
        device: string;
        storeName: string;
        publicUrl: string;
    }): { title: string; description: string; buttons: Array<{ type: string; displayText: string; url: string }> } {
        const { type, order, options, clientName, device, storeName, publicUrl } = ctx;

        const frontendUrl = publicUrl || options.origin || process.env.FRONTEND_URL || 'https://os4u.com.br';
        const statusUrl = `${frontendUrl.replace(/\/+$/, '')}/status/${order.id}`;

        let total = Number(order.finalValue) || 0;
        if (total === 0 && order.parts?.length > 0) {
            total = order.parts.reduce((acc, p) => acc + (Number(p.unitPrice) * p.quantity), 0);
        }
        const totalFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total);

        const buttons: Array<{ type: string; displayText: string; url: string }> = [
            { type: 'url', displayText: '🔍 Ver Status', url: statusUrl },
        ];

        let title = 'ATUALIZA\u00c7\u00c3O DE OS';
        let description = '';

        if (type === 'entry') {
            title = '📦 OS ABERTA';
            const defect = order.equipments?.[0]?.reportedDefect || (order as any).reportedDefect || 'n\u00e3o informado';
            description = `Ol\u00e1 ${clientName}, confirmamos a entrada do ${device} na ${storeName}.\n\n📄 *Protocolo:* ${order.protocol}\n🛠 *Defeito:* ${defect}`;
        } else if (type === 'exit') {
            title = '✅ SERVI\u00c7O CONCLU\u00cdDO';
            const lastComment = order.history?.find(h => h.comments && h.comments.length > 5)?.comments
                || order.history?.[0]?.comments
                || 'Servi\u00e7o conclu\u00eddo.';
            description = `Ol\u00e1 ${clientName}, o servi\u00e7o no ${device} foi finalizado!\n\n📄 *Protocolo:* ${order.protocol}\n💰 *Total:* ${totalFormatted}\n💬 *Observa\u00e7\u00f5es:* ${lastComment}`;
        } else if (type === 'update') {
            const latestHistory = order.history?.find(h => h.actionType === HistoryActionType.STATUS_CHANGE) || order.history?.[0];
            const statusLabel = latestHistory?.newStatus
                ? latestHistory.newStatus.toUpperCase().replace('_', ' ')
                : order.status.toUpperCase().replace('_', ' ');
            const comment = latestHistory?.comments || 'Status atualizado.';

            description = `Ol\u00e1 ${clientName}, informamos que o status da sua Ordem de Servi\u00e7o #${order.protocol} (${device}) foi atualizado para: *${statusLabel}*.\n\n💬 *Observa\u00e7\u00f5es:* ${comment}`;

            // Botões de aprovação passados pelo chamador — sem lógica de domínio aqui
            if (options.addApprovalButtons && options.approvalStorePhone) {
                const phone = options.approvalStorePhone.replace(/\D/g, '');
                const approveMsg = encodeURIComponent(`Ol\u00e1, estou acompanhando minha OS #${order.protocol} (${device}) e selecionei: ✅ APROVADO.`);
                const rejectMsg = encodeURIComponent(`Ol\u00e1, estou acompanhando minha OS #${order.protocol} (${device}) e selecionei: ❌ N\u00c3O APROVADO.`);
                buttons.push({ type: 'url', displayText: '✅ Aprovar', url: `https://wa.me/${phone}?text=${approveMsg}` });
                buttons.push({ type: 'url', displayText: '❌ Rejeitar', url: `https://wa.me/${phone}?text=${rejectMsg}` });
            }
        } else {
            description = `Ol\u00e1, sua Ordem de Servi\u00e7o #${order.protocol} foi atualizada.`;
        }

        return { title, description, buttons };
    }

    private async _recordAuditLog(
        orderId: string,
        currentStatus: string,
        message: string,
        type: string,
        userId?: string,
    ): Promise<void> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const recentStatusChange = await queryRunner.manager.findOne(OrderHistory, {
                where: { orderId, actionType: HistoryActionType.STATUS_CHANGE },
                order: { createdAt: 'DESC' },
            });

            const isRecent = recentStatusChange
                && (Date.now() - new Date(recentStatusChange.createdAt).getTime()) < 600000;

            if (isRecent) {
                recentStatusChange.waMsgSent = true;
                recentStatusChange.waMsgContent = message;
                if (!recentStatusChange.comments?.includes('[WhatsApp Enviado]')) {
                    recentStatusChange.comments = `${recentStatusChange.comments}\n\n[WhatsApp Enviado]`;
                }
                await queryRunner.manager.save(recentStatusChange);
                console.log(`[WhatsApp Share] Merged into history ID: ${recentStatusChange.id}`);
            } else {
                const history = queryRunner.manager.create(OrderHistory, {
                    orderId,
                    actionType: HistoryActionType.INTEGRATION,
                    previousStatus: currentStatus,
                    newStatus: currentStatus,
                    comments: `Notifica\u00e7\u00e3o WhatsApp (${type}) enviada`,
                    waMsgSent: true,
                    waMsgContent: message,
                    userId,
                });
                await queryRunner.manager.save(history);
                console.log(`[WhatsApp Share] Created new integration history entry`);
            }
            await queryRunner.commitTransaction();
        } catch (e) {
            await queryRunner.rollbackTransaction();
            console.error('[WhatsApp Share] Error updating history:', e);
        } finally {
            await queryRunner.release();
        }
    }
}
