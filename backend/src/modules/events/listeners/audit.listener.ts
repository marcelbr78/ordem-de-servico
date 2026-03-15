import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventDispatcher } from '../event-dispatcher.service';
import { AppEvent, WorkOrderCreatedPayload, WorkOrderStatusChangedPayload, QuoteUpdatedPayload } from '../event-types';

/**
 * Listener de Auditoria — registra todos os eventos no log.
 * Pode ser expandido para gravar no banco (AuditLog) se necessário.
 */
@Injectable()
export class AuditEventListener implements OnModuleInit {
    constructor(private eventDispatcher: EventDispatcher) { }

    onModuleInit() {
        this.eventDispatcher.on(AppEvent.WORK_ORDER_CREATED, (payload) => this.logEvent(AppEvent.WORK_ORDER_CREATED, payload));
        this.eventDispatcher.on(AppEvent.WORK_ORDER_STATUS_CHANGED, (payload) => this.logEvent(AppEvent.WORK_ORDER_STATUS_CHANGED, payload));
        this.eventDispatcher.on(AppEvent.QUOTE_UPDATED, (payload) => this.logEvent(AppEvent.QUOTE_UPDATED, payload));
    }

    private async logEvent(eventName: string, payload: any): Promise<void> {
        console.log(`[AuditListener] Event: ${eventName}`, JSON.stringify({
            ...payload,
            timestamp: payload.timestamp?.toISOString(),
        }));
        // Extensão futura: gravar no AuditLog via AuditService
    }
}
