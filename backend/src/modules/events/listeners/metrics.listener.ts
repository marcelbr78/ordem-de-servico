import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventDispatcher } from '../event-dispatcher.service';
import { AppEvent, WorkOrderCreatedPayload, WorkOrderStatusChangedPayload } from '../event-types';

/**
 * Listener de Métricas — atualiza contadores e métricas em tempo real.
 * Os contadores aqui são in-memory; podem ser persistidos se necessário.
 */
@Injectable()
export class MetricsEventListener implements OnModuleInit {
    private counters = {
        ordersCreated: 0,
        statusChanges: 0,
    };

    constructor(private eventDispatcher: EventDispatcher) { }

    onModuleInit() {
        this.eventDispatcher.on(AppEvent.WORK_ORDER_CREATED, (payload) => this.onOrderCreated(payload));
        this.eventDispatcher.on(AppEvent.WORK_ORDER_STATUS_CHANGED, (payload) => this.onStatusChanged(payload));
    }

    private async onOrderCreated(payload: WorkOrderCreatedPayload): Promise<void> {
        this.counters.ordersCreated++;
        console.log(`[MetricsListener] OS criadas nesta sessão: ${this.counters.ordersCreated}`);
    }

    private async onStatusChanged(payload: WorkOrderStatusChangedPayload): Promise<void> {
        this.counters.statusChanges++;
        console.log(`[MetricsListener] Mudanças de status nesta sessão: ${this.counters.statusChanges}`);
    }

    getCounters() {
        return { ...this.counters };
    }
}
