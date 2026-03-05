import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventDispatcher } from '../event-dispatcher.service';
import { AppEvent, WorkOrderCreatedPayload, WorkOrderStatusChangedPayload } from '../event-types';

/**
 * Listener de WhatsApp — escuta eventos de OS e pode disparar notificações.
 * NÃO modifica a lógica existente do WhatsappService/Evolution API.
 * Apenas reage a eventos para automações futuras.
 */
@Injectable()
export class WhatsAppEventListener implements OnModuleInit {
    constructor(private eventDispatcher: EventDispatcher) { }

    onModuleInit() {
        this.eventDispatcher.on(AppEvent.WORK_ORDER_CREATED, (payload) => this.onOrderCreated(payload));
        this.eventDispatcher.on(AppEvent.WORK_ORDER_STATUS_CHANGED, (payload) => this.onStatusChanged(payload));
    }

    private async onOrderCreated(payload: WorkOrderCreatedPayload): Promise<void> {
        console.log(`[WhatsAppListener] OS criada: ${payload.protocol} (tenant: ${payload.tenantId || 'N/A'})`);
        // Automação futura: notificação automática via WhatsApp
        // A lógica atual de notificação no OrdersService.notifyClient() continua inalterada
    }

    private async onStatusChanged(payload: WorkOrderStatusChangedPayload): Promise<void> {
        console.log(`[WhatsAppListener] Status alterado: ${payload.protocol} ${payload.previousStatus} → ${payload.newStatus}`);
        // Automação futura: enviar notificação automática de mudança de status
    }
}
