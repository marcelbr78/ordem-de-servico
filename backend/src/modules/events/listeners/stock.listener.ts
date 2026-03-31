import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventDispatcher } from '../event-dispatcher.service';
import { AppEvent, WorkOrderStatusChangedPayload } from '../event-types';
import { StockService } from '../../inventory/stock.service';
import { OrderPart } from '../../orders/entities/order-part.entity';
import { OrderService as OS } from '../../orders/entities/order-service.entity';

// Idempotência implementada no StockService.consumeStock e reverseMovement:
// consumeStock verifica StockMovement(type=EXIT, orderId) antes de executar.
// reverseMovement verifica antes de criar REVERSE_EXIT.
// Execuções duplicadas são ignoradas com segurança.
const STOCK_EVENT_DRIVEN_ENABLED = true;

@Injectable()
export class StockEventListener implements OnModuleInit {
    private readonly logger = new Logger(StockEventListener.name);

    constructor(
        private eventDispatcher: EventDispatcher,
        private stockService: StockService,
        @InjectRepository(OrderPart)
        private partsRepo: Repository<OrderPart>,
        @InjectRepository(OS)
        private ordersRepo: Repository<OS>,
    ) {}

    onModuleInit() {
        this.eventDispatcher.on(AppEvent.WORK_ORDER_STATUS_CHANGED, (p) => this.onOrderStatusChanged(p));
    }

    private async onOrderStatusChanged(payload: WorkOrderStatusChangedPayload): Promise<void> {
        if (!STOCK_EVENT_DRIVEN_ENABLED) return;

        const { newStatus, orderId } = payload;

        if (newStatus === 'finalizada') {
            await this._onFinalized(orderId);
        } else if (newStatus === 'cancelada') {
            await this._onCanceled(orderId);
        }
    }

    // ─── FINALIZADA: consumir estoque ──────────────────────────────────────

    private async _onFinalized(orderId: string): Promise<void> {
        try {
            const parts = await this.partsRepo.find({
                where: { orderId },
                relations: ['product'],
            });

            const partsToConsume = parts.filter(p => p.product?.type !== 'service');
            if (partsToConsume.length === 0) return;

            await this.stockService.consumeStock(
                orderId,
                partsToConsume.map(p => ({ productId: p.productId, quantity: p.quantity })),
                // sem manager — StockService abre sua própria transaction
            );
            this.logger.log(`[Stock] Consumo de estoque executado via evento para OS ${orderId}`);
        } catch (err) {
            this.logger.error(`[Stock] Erro ao consumir estoque via evento para OS ${orderId}: ${err?.message}`);
        }
    }

    // ─── CANCELADA: reverter estoque ───────────────────────────────────────

    private async _onCanceled(orderId: string): Promise<void> {
        try {
            await this.stockService.reverseMovement(orderId);
            this.logger.log(`[Stock] Reversão de estoque executada via evento para OS ${orderId}`);
        } catch (err) {
            this.logger.error(`[Stock] Erro ao reverter estoque via evento para OS ${orderId}: ${err?.message}`);
        }
    }
}
