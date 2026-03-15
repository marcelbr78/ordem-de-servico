import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Tenant, TenantStatus } from '../../modules/tenants/entities/tenant.entity';
import { Subscription, SubscriptionStatus } from '../../modules/tenants/entities/subscription.entity';
import { AuditLog } from '../../modules/audit/entities/audit-log.entity';
import { WhatsappService } from '../../modules/whatsapp/whatsapp.service';

export interface HealthReport {
    timestamp: string;
    overall: 'healthy' | 'degraded' | 'critical';
    services: ServiceStatus[];
    metrics: PlatformMetrics;
    recentErrors: ErrorEvent[];
    webhookStats: WebhookStats;
}

export interface ServiceStatus {
    name: string;
    status: 'up' | 'down' | 'degraded' | 'unknown';
    latencyMs?: number;
    message?: string;
    checkedAt: string;
}

export interface PlatformMetrics {
    totalTenants: number;
    activeTenants: number;
    trialTenants: number;
    suspendedTenants: number;
    pastDueTenants: number;
    activeSubscriptions: number;
    mrr: number;
    newTenantsToday: number;
    newTenantsThisWeek: number;
    churnedThisMonth: number;
    globalUsers: number;
    ordersToday: number;
    ordersThisWeek: number;
}

export interface ErrorEvent {
    time: string;
    type: string;
    message: string;
    tenantId?: string;
}

export interface WebhookStats {
    receivedToday: number;
    deliveredToday: number;
    failedToday: number;
    avgLatencyMs: number;
}

@Injectable()
export class HealthService {
    private readonly logger = new Logger(HealthService.name);

    constructor(
        @InjectRepository(Tenant) private tenantRepo: Repository<Tenant>,
        @InjectRepository(Subscription) private subRepo: Repository<Subscription>,
        @InjectRepository(AuditLog) private auditRepo: Repository<AuditLog>,
        private whatsappService: WhatsappService,
        private dataSource: DataSource,
    ) {}

    async getFullReport(): Promise<HealthReport> {
        const [services, metrics, recentErrors] = await Promise.all([
            this.checkServices(),
            this.getPlatformMetrics(),
            this.getRecentErrors(),
        ]);

        const criticalDown = services.filter(s => s.status === 'down').length;
        const degraded = services.filter(s => s.status === 'degraded').length;

        return {
            timestamp: new Date().toISOString(),
            overall: criticalDown > 0 ? 'critical' : degraded > 0 ? 'degraded' : 'healthy',
            services,
            metrics,
            recentErrors,
            webhookStats: await this.getWebhookStats(),
        };
    }

    private async checkServices(): Promise<ServiceStatus[]> {
        const results = await Promise.allSettled([
            this.checkDatabase(),
            this.checkWhatsApp(),
            this.checkBillingWebhook(),
        ]);

        return results.map(r => r.status === 'fulfilled' ? r.value : {
            name: 'Unknown',
            status: 'unknown' as const,
            checkedAt: new Date().toISOString(),
        });
    }

    private async checkDatabase(): Promise<ServiceStatus> {
        const start = Date.now();
        try {
            await this.dataSource.query('SELECT 1');
            const latency = Date.now() - start;
            return {
                name: 'Database (PostgreSQL)',
                status: latency > 500 ? 'degraded' : 'up',
                latencyMs: latency,
                message: latency > 500 ? 'Latência elevada' : 'Operacional',
                checkedAt: new Date().toISOString(),
            };
        } catch (e) {
            return { name: 'Database (PostgreSQL)', status: 'down', message: e.message, checkedAt: new Date().toISOString() };
        }
    }

    private async checkWhatsApp(): Promise<ServiceStatus> {
        const start = Date.now();
        try {
            const status = await this.whatsappService.checkConnectionStatus();
            const latency = Date.now() - start;
            return {
                name: 'Evolution API (WhatsApp)',
                status: status.connected ? 'up' : status.status === 'not_configured' ? 'unknown' : 'down',
                latencyMs: latency,
                message: status.connected
                    ? `Conectado${status.number ? ' · ' + status.number : ''}`
                    : status.status === 'not_configured' ? 'Não configurado' : `Desconectado (${status.status})`,
                checkedAt: new Date().toISOString(),
            };
        } catch (e) {
            return { name: 'Evolution API (WhatsApp)', status: 'down', message: e.message, checkedAt: new Date().toISOString() };
        }
    }

    private async checkBillingWebhook(): Promise<ServiceStatus> {
        // Verificar quando foi o último pagamento processado
        try {
            const lastPayment = await this.auditRepo.findOne({
                where: { action: 'WEBHOOK_PAYMENT' },
                order: { createdAt: 'DESC' },
            });
            const hoursSince = lastPayment
                ? (Date.now() - new Date(lastPayment.createdAt).getTime()) / 3600000
                : null;
            return {
                name: 'Billing Webhook (PagBank)',
                status: 'up',
                message: lastPayment
                    ? `Último: ${Math.round(hoursSince!)}h atrás`
                    : 'Aguardando primeiro evento',
                checkedAt: new Date().toISOString(),
            };
        } catch {
            return { name: 'Billing Webhook (PagBank)', status: 'unknown', message: 'Sem dados', checkedAt: new Date().toISOString() };
        }
    }

    private async getPlatformMetrics(): Promise<PlatformMetrics> {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now.getTime() - 7 * 86400000);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [
            totalTenants, activeTenants, trialTenants, suspendedTenants,
            pastDueTenants, globalUsers,
        ] = await Promise.all([
            this.tenantRepo.count(),
            this.tenantRepo.count({ where: { status: TenantStatus.ACTIVE } }),
            this.tenantRepo.count({ where: { status: TenantStatus.TRIAL } }),
            this.tenantRepo.count({ where: { status: TenantStatus.SUSPENDED } }),
            this.tenantRepo.count({ where: { status: TenantStatus.PAST_DUE } }),
            this.dataSource.query('SELECT COUNT(*) as c FROM users WHERE "isActive" = true').then(r => parseInt(r[0]?.c || '0')).catch(() => 0),
        ]);

        const activeSubs = await this.subRepo.find({ where: { status: SubscriptionStatus.ACTIVE }, relations: ['plan'] });
        const mrr = activeSubs.reduce((s, sub) => s + (Number(sub.plan?.price) || 0), 0);

        const [newToday, newWeek, ordersToday, ordersWeek] = await Promise.all([
            this.tenantRepo.createQueryBuilder('t').where('t.createdAt >= :d', { d: startOfDay }).getCount().catch(() => 0),
            this.tenantRepo.createQueryBuilder('t').where('t.createdAt >= :d', { d: startOfWeek }).getCount().catch(() => 0),
            this.dataSource.query('SELECT COUNT(*) as c FROM order_services WHERE "entryDate" >= $1 AND "deletedAt" IS NULL', [startOfDay]).then(r => parseInt(r[0]?.c || '0')).catch(() => 0),
            this.dataSource.query('SELECT COUNT(*) as c FROM order_services WHERE "entryDate" >= $1 AND "deletedAt" IS NULL', [startOfWeek]).then(r => parseInt(r[0]?.c || '0')).catch(() => 0),
        ]);

        const churnedThisMonth = await this.subRepo.createQueryBuilder('s')
            .where('s.status = :s', { s: SubscriptionStatus.CANCELLED })
            .andWhere('s.cancelledAt >= :d', { d: startOfMonth })
            .getCount().catch(() => 0);

        return {
            totalTenants, activeTenants, trialTenants, suspendedTenants, pastDueTenants,
            activeSubscriptions: activeSubs.length,
            mrr: Math.round(mrr),
            newTenantsToday: newToday,
            newTenantsThisWeek: newWeek,
            churnedThisMonth,
            globalUsers,
            ordersToday,
            ordersThisWeek: ordersWeek,
        };
    }

    private async getRecentErrors(): Promise<ErrorEvent[]> {
        try {
            const logs = await this.auditRepo.find({
                where: { action: 'ERROR' },
                order: { createdAt: 'DESC' },
                take: 20,
            });
            return logs.map(l => ({
                time: l.createdAt.toISOString(),
                type: l.resource || 'System',
                message: l.details || 'Erro sem detalhes',
                tenantId: (l as any).tenantId,
            }));
        } catch { return []; }
    }

    private async getWebhookStats(): Promise<WebhookStats> {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        try {
            const webhooks = await this.auditRepo.createQueryBuilder('a')
                .where('a.action LIKE :a', { a: 'WEBHOOK%' })
                .andWhere('a.createdAt >= :d', { d: startOfDay })
                .getMany();
            return {
                receivedToday: webhooks.length,
                deliveredToday: webhooks.filter(w => w.action === 'WEBHOOK_DELIVERED').length,
                failedToday: webhooks.filter(w => w.action === 'WEBHOOK_FAILED').length,
                avgLatencyMs: 0,
            };
        } catch {
            return { receivedToday: 0, deliveredToday: 0, failedToday: 0, avgLatencyMs: 0 };
        }
    }

    async getOnboardingScores() {
        const tenants = await this.tenantRepo.find({ order: { createdAt: 'DESC' }, take: 50 });
        const scores = await Promise.all(tenants.map(async t => {
            const steps = await Promise.all([
                // 1. Configurou empresa (tem storeName)
                Promise.resolve({ key: 'company_setup', label: 'Configurou empresa', done: !!(t as any).storeName || !!(t as any).name, points: 10 }),
                // 2. Conectou WhatsApp
                this.dataSource.query("SELECT value FROM system_settings WHERE key='whatsapp_instance_name' AND \"tenantId\"=$1 LIMIT 1", [t.id])
                    .then(r => ({ key: 'whatsapp', label: 'Conectou WhatsApp', done: r.length > 0 && !!r[0]?.value, points: 25 })).catch(() => ({ key: 'whatsapp', label: 'Conectou WhatsApp', done: false, points: 25 })),
                // 3. Criou primeiro cliente
                this.dataSource.query("SELECT COUNT(*) as c FROM clients WHERE \"tenantId\"=$1", [t.id])
                    .then(r => ({ key: 'first_client', label: 'Cadastrou clientes', done: parseInt(r[0]?.c || '0') > 0, points: 10 })).catch(() => ({ key: 'first_client', label: 'Cadastrou clientes', done: false, points: 10 })),
                // 4. Criou primeiro fornecedor
                this.dataSource.query("SELECT COUNT(*) as c FROM smartparts_suppliers WHERE \"tenantId\"=$1", [t.id])
                    .then(r => ({ key: 'first_supplier', label: 'Cadastrou fornecedores', done: parseInt(r[0]?.c || '0') > 0, points: 15 })).catch(() => ({ key: 'first_supplier', label: 'Cadastrou fornecedores', done: false, points: 15 })),
                // 5. Criou 1ª OS
                this.dataSource.query("SELECT COUNT(*) as c FROM order_services WHERE \"tenantId\"=$1", [t.id])
                    .then(r => ({ key: 'first_os', label: 'Criou 1ª OS', done: parseInt(r[0]?.c || '0') >= 1, points: 20 })).catch(() => ({ key: 'first_os', label: 'Criou 1ª OS', done: false, points: 20 })),
                // 6. Criou 10+ OS
                this.dataSource.query("SELECT COUNT(*) as c FROM order_services WHERE \"tenantId\"=$1", [t.id])
                    .then(r => ({ key: 'ten_os', label: 'Criou 10+ OS', done: parseInt(r[0]?.c || '0') >= 10, points: 20 })).catch(() => ({ key: 'ten_os', label: 'Criou 10+ OS', done: false, points: 20 })),
            ]);

            const score = steps.reduce((s, step) => s + (step.done ? step.points : 0), 0);
            return {
                tenantId: t.id,
                tenantName: (t as any).storeName || (t as any).name || t.id.slice(0,8),
                status: t.status,
                score,
                maxScore: steps.reduce((s, step) => s + step.points, 0),
                steps,
                createdAt: t.createdAt,
            };
        }));
        return scores.sort((a, b) => b.score - a.score);
    }

    async getAdvancedAnalytics() {
        const now = new Date();
        const months: any[] = [];
        for (let i = 5; i >= 0; i--) {
            const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
            const label = start.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });

            const [newTenants, churned, orders, revenue] = await Promise.all([
                this.tenantRepo.createQueryBuilder('t').where('t.createdAt BETWEEN :s AND :e', { s: start, e: end }).getCount().catch(() => 0),
                this.subRepo.createQueryBuilder('s').where("s.status = 'cancelled'").andWhere('s.updatedAt BETWEEN :s AND :e', { s: start, e: end }).getCount().catch(() => 0),
                this.dataSource.query("SELECT COUNT(*) as c FROM order_services WHERE \"entryDate\" BETWEEN $1 AND $2", [start, end]).then(r => parseInt(r[0]?.c || '0')).catch(() => 0),
                this.subRepo.createQueryBuilder('s').leftJoin('s.plan', 'p').where("s.status = 'active'").andWhere('s.createdAt <= :e', { e: end }).select('SUM(p.price)', 'total').getRawOne().then(r => parseFloat(r?.total || '0')).catch(() => 0),
            ]);

            months.push({ month: label, newTenants, churned, orders, revenue: Math.round(revenue) });
        }

        // Distribuição por plano
        const planDist = await this.subRepo.createQueryBuilder('s')
            .leftJoin('s.plan', 'p')
            .where("s.status = 'active'")
            .select('p.name', 'plan')
            .addSelect('COUNT(*)', 'count')
            .groupBy('p.name')
            .getRawMany().catch(() => []);

        // Horários de pico (OS criadas por hora)
        const hourlyActivity = await this.dataSource.query(
            "SELECT EXTRACT(HOUR FROM \"entryDate\") as hour, COUNT(*) as count FROM order_services WHERE \"entryDate\" > NOW() - INTERVAL '30 days' GROUP BY hour ORDER BY hour"
        ).catch(() => []);

        return { months, planDistribution: planDist, hourlyActivity };
    }

    async getAuditLogs(page = 1, search?: string) {
        const take = 20;
        const skip = (page - 1) * take;
        const qb = this.auditRepo.createQueryBuilder('a')
            .leftJoinAndSelect('a.user', 'user')
            .orderBy('a.createdAt', 'DESC')
            .take(take).skip(skip);
        if (search) {
            qb.where('a.action ILIKE :s OR a.resource ILIKE :s', { s: `%${search}%` });
        }
        const [data, total] = await qb.getManyAndCount().catch(() => [[], 0] as [any[], number]);
        return { data, total, page };
    }
}
