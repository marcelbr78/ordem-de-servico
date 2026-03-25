import { Controller, Get, Post, Param, Body, NotFoundException, Req, Logger, Inject, forwardRef } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { TenantsService } from '../tenants/tenants.service';
import { ConversationService } from './conversation.service';
import { MessageChannel } from './entities/order-conversation.entity';
import { Request } from 'express';
import { OSStatus } from './entities/order-service.entity';
import { SmartPartsService } from '../smartparts/smartparts.service';

@Controller('orders/public')
export class PublicOrdersController {
    private readonly logger = new Logger(PublicOrdersController.name);

    constructor(
        private readonly ordersService: OrdersService,
        private readonly tenantsService: TenantsService,
        private readonly conversationService: ConversationService,
        @Inject(forwardRef(() => SmartPartsService)) private readonly smartPartsService: SmartPartsService,
    ) {}

    @Get('monitor')
    findMonitor() {
        return this.ordersService.findAllActive();
    }

    // ── Webhook Evolution API — recebe mensagens do WhatsApp ────────
    // URL configurada no Evolution: https://api.os4u.com.br/orders/public/wa-webhook
    @Post('wa-webhook')
    async evolutionWebhook(@Body() body: any) {
        try {
            const event = body?.event;
            if (event !== 'messages.upsert' && event !== 'messages.update') {
                return { ok: true };
            }

            const data = body?.data;
            if (!data) return { ok: true };

            // Extrai número do cliente (remove @s.whatsapp.net, @c.us, etc.)
            const remoteJid: string = data?.key?.remoteJid || '';
            if (!remoteJid) return { ok: true };

            // Ignora grupos e broadcasts
            if (remoteJid.includes('@g.us') || remoteJid.includes('@broadcast')) return { ok: true };

            // Verifica comprimento mínimo do ID (sem o domínio)
            const rawId = remoteJid.replace(/@\S+/g, '');
            if (!rawId || rawId.replace(/\D/g, '').length < 8) return { ok: true };

            const pushName: string = data?.pushName || '';
            const externalId: string = data?.key?.id || '';

            // Extrai texto da mensagem (suporta vários tipos de mídia)
            const msg = data?.message || {};
            const text: string =
                msg?.conversation ||
                msg?.extendedTextMessage?.text ||
                msg?.imageMessage?.caption ||
                msg?.videoMessage?.caption ||
                (msg?.audioMessage ? '[Áudio recebido]' :
                msg?.documentMessage ? '[Documento recebido]' :
                msg?.stickerMessage ? '[Figurinha recebida]' :
                msg?.locationMessage ? '[Localização recebida]' :
                '[Mensagem recebida]');

            this.logger.debug(`[Webhook] JID=${remoteJid} fromMe=${data?.key?.fromMe} pushName="${pushName}" text="${text?.slice(0,40)}"`);

            if (data?.key?.fromMe === true) {
                // Mensagem enviada pela loja direto no WhatsApp (não pelo sistema)
                const saved = await this.conversationService.recordManualOutbound({
                    remoteJid,
                    pushName,
                    content: text,
                    channel: MessageChannel.WHATSAPP,
                    externalId: externalId || undefined,
                });
                if (saved) {
                    this.logger.log(`[Webhook] Loja → ${remoteJid} gravada na OS ${saved.orderId}`);
                }
            } else {
                // Roteia para SmartParts: se for fornecedor, processa cotação;
                // se não for, o próprio SmartParts delega para conversationService
                await this.smartPartsService.handleIncomingMessage(remoteJid, text, pushName);
            }
        } catch (e) {
            this.logger.error(`[Webhook] Erro ao processar: ${e?.message}`);
        }

        return { ok: true };
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @Req() req: Request) {
        const tenantId = req['tenantId'] || 'default';
        let tenant = null;
        try { tenant = await this.tenantsService.findById(tenantId); } catch {}

        try {
            const order = await this.ordersService.findOne(id);
            // Registra acesso do cliente ao link público (fire-and-forget)
            this.ordersService.recordPublicAccess(id).catch(() => {});
            return {
                id: order.id,
                protocol: order.protocol,
                status: order.status,
                priority: order.priority,
                updatedAt: order.updatedAt,
                entryDate: order.entryDate,
                exitDate: order.exitDate,
                equipments: order.equipments,
                diagnosis: order.diagnosis,
                technicalReport: order.technicalReport,
                estimatedValue: order.estimatedValue,
                finalValue: order.finalValue,
                history: (order as any).history?.slice(-5) || [],
                shopName: tenant?.name || 'Nossa Loja',
                shopPhone: tenant?.phone || '',
                // Mostrar orçamento somente se aguardando aprovação
                showBudget: order.status === OSStatus.AGUARDANDO_APROVACAO,
            };
        } catch {
            throw new NotFoundException('Ordem de Serviço não encontrada.');
        }
    }

    // ── Aprovação / Rejeição de orçamento ──────────────────────────
    @Post(':id/approve')
    async approveOrder(
        @Param('id') id: string,
        @Body() body: { approved: boolean; clientNote?: string },
    ) {
        const order = await this.ordersService.findOne(id);
        if (!order) throw new NotFoundException('OS não encontrada.');

        if (order.status !== OSStatus.AGUARDANDO_APROVACAO) {
            return { success: false, message: 'Esta OS não está aguardando aprovação.' };
        }

        const newStatus = body.approved ? OSStatus.AGUARDANDO_PECA : OSStatus.CANCELADA;
        const comment = body.approved
            ? `✅ Orçamento aprovado pelo cliente via link público.${body.clientNote ? ' Observação: ' + body.clientNote : ''}`
            : `❌ Orçamento rejeitado pelo cliente via link público.${body.clientNote ? ' Motivo: ' + body.clientNote : ''}`;

        await this.ordersService.changeStatus(
            id,
            { status: newStatus, comments: comment },
            undefined,
            (order as any).tenantId,
        );

        return {
            success: true,
            approved: body.approved,
            newStatus,
            message: body.approved
                ? 'Orçamento aprovado! Em breve iniciaremos o reparo.'
                : 'Entendemos. A OS foi cancelada. Você pode retirar seu equipamento.',
        };
    }
}
