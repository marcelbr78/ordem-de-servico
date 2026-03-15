import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Subscription, SubscriptionStatus } from '../../modules/tenants/entities/subscription.entity';
import { Tenant, TenantStatus } from '../../modules/tenants/entities/tenant.entity';
import { Plan } from '../../modules/tenants/entities/plan.entity';

export type BillingEvent =
    | 'payment.confirmed' | 'payment.failed'
    | 'subscription.cancelled' | 'subscription.renewed'
    | 'charge.paid' | 'charge.overdue';

@Injectable()
export class SubscriptionsService {
    private readonly logger = new Logger(SubscriptionsService.name);

    constructor(
        @InjectRepository(Subscription) private subRepo: Repository<Subscription>,
        @InjectRepository(Tenant) private tenantRepo: Repository<Tenant>,
        @InjectRepository(Plan) private planRepo: Repository<Plan>,
    ) {}

    async findAll(): Promise<Subscription[]> {
        return this.subRepo.find({ relations: ['plan'], order: { createdAt: 'DESC' } });
    }

    async findByTenant(tenantId: string): Promise<Subscription | null> {
        return this.subRepo.findOne({ where: { tenantId }, relations: ['plan'] });
    }

    // ── Processar webhook de pagamento ────────────────────────────
    async processWebhook(payload: {
        event: BillingEvent;
        externalId?: string;
        tenantId?: string;
        amount?: number;
        nextBillingDate?: string;
        metadata?: Record<string, any>;
    }): Promise<{ processed: boolean; action: string; tenantId?: string }> {

        this.logger.log(`[Billing] Webhook: ${payload.event} | ext: ${payload.externalId}`);

        // Localizar subscription
        let sub: Subscription | null = null;
        if (payload.externalId) {
            sub = await this.subRepo.findOne({ where: { externalId: payload.externalId }, relations: ['plan'] });
        }
        if (!sub && payload.tenantId) {
            sub = await this.subRepo.findOne({ where: { tenantId: payload.tenantId }, relations: ['plan'] });
        }
        if (!sub && payload.metadata?.tenantId) {
            sub = await this.subRepo.findOne({ where: { tenantId: payload.metadata.tenantId }, relations: ['plan'] });
        }
        if (!sub) {
            this.logger.warn(`[Billing] Subscription não encontrada para: ${payload.event}`);
            return { processed: false, action: 'not_found' };
        }

        const tenant = await this.tenantRepo.findOne({ where: { id: sub.tenantId } });

        switch (payload.event) {
            case 'payment.confirmed':
            case 'charge.paid':
            case 'subscription.renewed':
                sub.status = SubscriptionStatus.ACTIVE;
                sub.nextBilling = payload.nextBillingDate
                    ? new Date(payload.nextBillingDate)
                    : new Date(Date.now() + 30 * 86400000);
                await this.subRepo.save(sub);
                if (tenant && tenant.status !== TenantStatus.ACTIVE) {
                    tenant.status = TenantStatus.ACTIVE;
                    await this.tenantRepo.save(tenant);
                    this.logger.log(`[Billing] ✅ Tenant ${sub.tenantId} reativado`);
                }
                return { processed: true, action: 'activated', tenantId: sub.tenantId };

            case 'payment.failed':
            case 'charge.overdue':
                sub.status = SubscriptionStatus.PAST_DUE;
                await this.subRepo.save(sub);
                if (tenant && tenant.status === TenantStatus.ACTIVE) {
                    tenant.status = TenantStatus.PAST_DUE;
                    await this.tenantRepo.save(tenant);
                    this.logger.warn(`[Billing] ⚠️ Tenant ${sub.tenantId} marcado como inadimplente`);
                }
                return { processed: true, action: 'past_due', tenantId: sub.tenantId };

            case 'subscription.cancelled':
                sub.status = SubscriptionStatus.CANCELLED;
                sub.cancelledAt = new Date();
                await this.subRepo.save(sub);
                if (tenant) {
                    tenant.status = TenantStatus.SUSPENDED;
                    await this.tenantRepo.save(tenant);
                    this.logger.warn(`[Billing] 🔒 Tenant ${sub.tenantId} suspenso por cancelamento`);
                }
                return { processed: true, action: 'cancelled', tenantId: sub.tenantId };

            default:
                return { processed: false, action: 'ignored' };
        }
    }

    // ── Cron diário: suspender inadimplentes ──────────────────────
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async suspendOverdueJob(): Promise<void> {
        this.logger.log('[Billing] Verificando inadimplentes...');
        try {
            const graceDays = 7;
            const cutoff = new Date(Date.now() - graceDays * 86400000);

            // past_due há mais de 7 dias → suspender
            const overdueList = await this.subRepo.find({ where: { status: SubscriptionStatus.PAST_DUE } });
            let suspended = 0;
            for (const sub of overdueList) {
                const nb = sub.nextBilling ? new Date(sub.nextBilling) : null;
                if (nb && nb < cutoff) {
                    const tenant = await this.tenantRepo.findOne({ where: { id: sub.tenantId } });
                    if (tenant && tenant.status !== TenantStatus.SUSPENDED) {
                        tenant.status = TenantStatus.SUSPENDED;
                        await this.tenantRepo.save(tenant);
                        suspended++;
                    }
                }
            }

            // Trial expirado → past_due
            const trials = await this.subRepo.find({ where: { status: SubscriptionStatus.TRIAL } });
            let expired = 0;
            for (const sub of trials) {
                const te = sub.trialEndsAt ? new Date(sub.trialEndsAt) : null;
                if (te && te < new Date()) {
                    sub.status = SubscriptionStatus.PAST_DUE;
                    await this.subRepo.save(sub);
                    const tenant = await this.tenantRepo.findOne({ where: { id: sub.tenantId } });
                    if (tenant) {
                        tenant.status = TenantStatus.PAST_DUE;
                        await this.tenantRepo.save(tenant);
                        expired++;
                    }
                }
            }

            if (suspended > 0 || expired > 0) {
                this.logger.log(`[Billing] ${suspended} suspensos, ${expired} trials expirados`);
            }
        } catch (err) {
            this.logger.error(`[Billing] Erro no cron: ${(err as Error).message}`);
        }
    }
}
