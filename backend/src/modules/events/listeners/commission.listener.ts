import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { EventDispatcher } from '../event-dispatcher.service';
import { AppEvent, WorkOrderStatusChangedPayload } from '../event-types';
import { CommissionsService } from '../../commissions/commissions.service';

/** Status que disparam cálculo de comissão — espelha _handleCommissionEffects */
const COMMISSION_TRIGGER_STATUSES = new Set(['entregue', 'finalizada']);

@Injectable()
export class CommissionEventListener implements OnModuleInit {
    private readonly logger = new Logger(CommissionEventListener.name);

    constructor(
        private eventDispatcher: EventDispatcher,
        private commissionsService: CommissionsService,
    ) {}

    onModuleInit() {
        this.eventDispatcher.on(AppEvent.WORK_ORDER_STATUS_CHANGED, (p) => this.onOrderStatusChanged(p));
    }

    private async onOrderStatusChanged(payload: WorkOrderStatusChangedPayload): Promise<void> {
        if (!COMMISSION_TRIGGER_STATUSES.has(payload.newStatus)) return;

        try {
            await this.commissionsService.calculateForOrder(payload.orderId, payload.tenantId);
            this.logger.log(`Comissão calculada via evento para OS ${payload.orderId} (status: ${payload.newStatus})`);
        } catch (err) {
            this.logger.error(`Erro ao calcular comissão via evento para OS ${payload.orderId}: ${err?.message}`);
        }
    }
}
