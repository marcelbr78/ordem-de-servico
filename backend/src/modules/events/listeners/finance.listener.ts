import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { EventDispatcher } from '../event-dispatcher.service';
import { AppEvent, WorkOrderStatusChangedPayload } from '../event-types';
import { FinanceService } from '../../finance/finance.service';
import { TransactionType } from '../../finance/entities/transaction.entity';

/**
 * ─── ATIVAÇÃO CONTROLADA ─────────────────────────────────────────────────────
 *
 * true  → handler ativo (fase dual-execution: roda junto com _handleFinanceEffects)
 * false → handler registrado, inativo
 *
 * Durante validação: manter _handleFinanceEffects em changeStatus.
 * A idempotência em FinanceService.create garante que não haverá duplicação.
 *
 * ⚠️ ANTES DE REMOVER _handleFinanceEffects:
 *   O saldo bancário só é atualizado quando create() recebe `manager` (queryRunner).
 *   Sem manager (este handler), o saldo não é atualizado pelo caminho do evento.
 *   Resolver: injetar DataSource em FinanceService para operar sem queryRunner externo.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const FINANCE_EVENT_DRIVEN_ENABLED = true;

@Injectable()
export class FinanceEventListener implements OnModuleInit {
    private readonly logger = new Logger(FinanceEventListener.name);

    constructor(
        private eventDispatcher: EventDispatcher,
        private financeService: FinanceService,
    ) {}

    onModuleInit() {
        this.eventDispatcher.on(AppEvent.WORK_ORDER_STATUS_CHANGED, (p) => this.onOrderStatusChanged(p));
    }

    private async onOrderStatusChanged(payload: WorkOrderStatusChangedPayload): Promise<void> {
        if (!FINANCE_EVENT_DRIVEN_ENABLED) return;

        // Apenas ENTREGUE com pagamento informado
        if (payload.newStatus !== 'entregue') return;
        if (!payload.paymentAmount || payload.paymentAmount <= 0) return;

        this.logger.log(`[Finance] Registrando transação via evento para OS ${payload.orderId}`);

        try {
            const clientLabel = payload.customerName || 'Cliente';
            await this.financeService.create(
                {
                    type: TransactionType.INCOME,
                    amount: payload.paymentAmount,
                    category: 'Pagamento de OS',
                    description: `Liquidação da OS #${payload.protocol} - Cliente: ${clientLabel} (${payload.paymentMethod || 'A definir'})`,
                    orderId: payload.orderId,
                    paymentMethod: payload.paymentMethod || 'A definir',
                    bankAccountId: payload.bankAccountId,
                },
                payload.tenantId,
                undefined, // sem queryRunner — execução eventual fora da transaction de status
            );
            this.logger.log(`[Finance] Transação processada para OS ${payload.orderId}`);
        } catch (err) {
            this.logger.error(`[Finance] Erro ao registrar transação via evento para OS ${payload.orderId}: ${err?.message}`);
        }
    }
}
