import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { EventDispatcher } from '../event-dispatcher.service';
import { AppEvent, WorkOrderCreatedPayload, WorkOrderStatusChangedPayload } from '../event-types';
import { WhatsappService } from '../../whatsapp/whatsapp.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderService as OS } from '../../orders/entities/order-service.entity';
import { SettingsService } from '../../settings/settings.service';

const STATUS_MESSAGES: Record<string, { emoji: string; label: string; detail: string }> = {
    em_diagnostico:       { emoji: '🔍', label: 'Em Diagnóstico',      detail: 'Nossos técnicos estão analisando seu equipamento.' },
    aguardando_aprovacao: { emoji: '💬', label: 'Orçamento Pronto',    detail: 'O diagnóstico foi concluído. Acesse o link para ver o orçamento e aprovar o serviço.' },
    aguardando_peca:      { emoji: '📦', label: 'Aguardando Peça',     detail: 'Aguardando chegada das peças para iniciar o reparo.' },
    em_reparo:            { emoji: '🔧', label: 'Em Reparo',           detail: 'Seu equipamento está sendo reparado por nossos técnicos.' },
    testes:               { emoji: '🧪', label: 'Em Testes',           detail: 'O reparo foi concluído e estamos realizando os testes finais.' },
    finalizada:           { emoji: '✅', label: 'Pronto para Retirada', detail: 'Seu equipamento está pronto! Você já pode vir buscá-lo.' },
    entregue:             { emoji: '🎉', label: 'Entregue',            detail: 'Obrigado por confiar em nossos serviços! Qualquer problema, estamos à disposição.' },
    cancelada:            { emoji: '❌', label: 'Cancelada',           detail: 'Sua Ordem de Serviço foi cancelada. Entre em contato para mais informações.' },
};

@Injectable()
export class WhatsAppEventListener implements OnModuleInit {
    private readonly logger = new Logger(WhatsAppEventListener.name);

    constructor(
        private eventDispatcher: EventDispatcher,
        private whatsappService: WhatsappService,
        private settingsService: SettingsService,
        @InjectRepository(OS) private ordersRepo: Repository<OS>,
    ) {}

    onModuleInit() {
        this.eventDispatcher.on(AppEvent.WORK_ORDER_CREATED, (p) => this.onOrderCreated(p));
        this.eventDispatcher.on(AppEvent.WORK_ORDER_STATUS_CHANGED, (p) => this.onStatusChanged(p));
    }

    // ── Helpers ───────────────────────────────────────────────
    private async getClientPhone(orderId: string): Promise<string | null> {
        try {
            const order = await this.ordersRepo.findOne({
                where: { id: orderId },
                relations: ['client'],
            });
            if (!order) return null;
            const client = (order as any).client;
            // Prioridade: contato principal WhatsApp > qualquer contato
            const contacts = client?.contatos || [];
            const wa = contacts.find((c: any) => c.tipo === 'whatsapp' && c.principal)
                || contacts.find((c: any) => c.tipo === 'whatsapp')
                || contacts.find((c: any) => c.principal)
                || contacts[0];
            return wa?.numero || client?.email || null;
        } catch (err) {
            this.logger.warn(`Erro ao buscar telefone do cliente (OS ${orderId}): ${err.message}`);
            return null;
        }
    }

    private async getStatusUrl(protocol: string): Promise<string | null> {
        try {
            const baseUrl = await this.settingsService.findByKey('company_url');
            if (!baseUrl) return null;
            return `${baseUrl.replace(/\/$/, '')}/status/${protocol}`;
        } catch { return null; }
    }

    private async isWhatsappEnabled(): Promise<boolean> {
        try {
            const status = await this.whatsappService.getConfigStatus();
            return status.configured && status.hasInstance;
        } catch { return false; }
    }

    // ── OS Criada ─────────────────────────────────────────────
    private async onOrderCreated(payload: WorkOrderCreatedPayload): Promise<void> {
        this.logger.log(`[WA] OS criada: ${payload.protocol}`);
        try {
            if (!await this.isWhatsappEnabled()) return;
            const phone = await this.getClientPhone(payload.orderId);
            if (!phone) { this.logger.warn(`[WA] Sem telefone para OS ${payload.protocol}`); return; }

            const order = await this.ordersRepo.findOne({
                where: { id: payload.orderId },
                relations: ['equipments'],
            });
            const eq = (order as any)?.equipments?.[0];
            const equipment = eq ? `${eq.brand} ${eq.model}` : 'equipamento';
            const statusUrl = await this.getStatusUrl(payload.protocol);

            await this.whatsappService.sendOSCreated(phone, payload.protocol, equipment, statusUrl);
            this.logger.log(`[WA] Notificação de abertura enviada para OS ${payload.protocol}`);
        } catch (err) {
            this.logger.error(`[WA] Erro ao notificar criação OS ${payload.protocol}: ${err.message}`);
        }
    }

    // ── Status Alterado ───────────────────────────────────────
    private async onStatusChanged(payload: WorkOrderStatusChangedPayload): Promise<void> {
        this.logger.log(`[WA] Status: ${payload.protocol} → ${payload.newStatus}`);
        const cfg = STATUS_MESSAGES[payload.newStatus];
        if (!cfg) return; // status sem mensagem configurada

        try {
            if (!await this.isWhatsappEnabled()) return;
            const phone = await this.getClientPhone(payload.orderId);
            if (!phone) return;

            const statusUrl = await this.getStatusUrl(payload.protocol);
            const companyName = await this.settingsService.findByKey('company_name') || 'Assistência Técnica';

            let msg = `${cfg.emoji} *${cfg.label}*\n\n`;
            msg += `Olá! Sua OS *#${payload.protocol}* foi atualizada.\n\n`;
            msg += `${cfg.detail}`;
            if (statusUrl) msg += `\n\n🔗 *Acompanhe:* ${statusUrl}`;
            msg += `\n\n_${companyName}_`;

            // Para orçamento: usar botão interativo se disponível
            if (payload.newStatus === 'aguardando_aprovacao' && statusUrl) {
                await this.whatsappService.sendButtons(
                    phone,
                    `${cfg.emoji} Orçamento Disponível`,
                    `OS *#${payload.protocol}* — ${cfg.detail}`,
                    [{ type: 'url', displayText: '📋 Ver Orçamento', url: statusUrl }],
                    companyName,
                );
            } else {
                await this.whatsappService.sendMessage(phone, msg);
            }

            this.logger.log(`[WA] Notificação de status enviada: ${payload.protocol} → ${payload.newStatus}`);
        } catch (err) {
            this.logger.error(`[WA] Erro ao notificar status ${payload.protocol}: ${err.message}`);
        }
    }
}
