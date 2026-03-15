import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Tenant, TenantStatus } from '../../modules/tenants/entities/tenant.entity';
import { Subscription } from '../../modules/tenants/entities/subscription.entity';
import { Plan } from '../../modules/tenants/entities/plan.entity';

@Injectable()
export class TenantsService {
    constructor(
        @InjectRepository(Tenant) private tenantsRepository: Repository<Tenant>,
        @InjectRepository(Subscription) private subscriptionsRepository: Repository<Subscription>,
        @InjectRepository(Plan) private plansRepository: Repository<Plan>,
        private dataSource: DataSource,
    ) {}

    async findAll(page: number = 1, limit: number = 20) {
        const [items, total] = await this.tenantsRepository.findAndCount({
            skip: (page - 1) * limit, take: limit, order: { createdAt: 'DESC' }
        });

        const tenantIds = items.map(t => t.id);
        const subscriptions = tenantIds.length > 0
            ? await this.subscriptionsRepository.find({
                where: tenantIds.map(id => ({ tenantId: id })),
                relations: ['plan'],
            }) : [];
        const subMap = new Map(subscriptions.map(s => [s.tenantId, s]));

        const enriched = items.map(t => ({ ...t, subscription: subMap.get(t.id) ?? null }));
        return { data: enriched, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }

    async findOne(id: string) {
        const tenant = await this.tenantsRepository.findOne({ where: { id } });
        if (!tenant) throw new NotFoundException('Tenant não encontrado');
        const subscription = await this.subscriptionsRepository.findOne({
            where: { tenantId: id }, relations: ['plan'],
        });
        return { ...tenant, subscription: subscription ?? null };
    }

    // ── Métricas reais de uso do tenant ──────────────────────────
    async getUsageMetrics(tenantId: string): Promise<{
        ordersThisMonth: number;
        totalOrders: number;
        activeUsers: number;
        inventoryItems: number;
        lastActivity: Date | null;
    }> {
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

        // Usar DataSource para consultas cruzadas de tabelas
        const [ordersMonth, totalOrders, activeUsers, inventoryItems] = await Promise.all([
            this.dataSource.query(
                `SELECT COUNT(*) as count FROM order_services WHERE "tenantId" = $1 AND "entryDate" >= $2 AND "deletedAt" IS NULL`,
                [tenantId, startOfMonth]
            ).catch(() => [{ count: 0 }]),

            this.dataSource.query(
                `SELECT COUNT(*) as count FROM order_services WHERE "tenantId" = $1 AND "deletedAt" IS NULL`,
                [tenantId]
            ).catch(() => [{ count: 0 }]),

            this.dataSource.query(
                `SELECT COUNT(*) as count FROM users WHERE "tenantId" = $1 AND "isActive" = true`,
                [tenantId]
            ).catch(() => [{ count: 0 }]),

            this.dataSource.query(
                `SELECT COUNT(*) as count FROM products WHERE "tenantId" = $1`,
                [tenantId]
            ).catch(() => [{ count: 0 }]),
        ]);

        // Última atividade (última OS)
        const lastOrder = await this.dataSource.query(
            `SELECT "entryDate" FROM order_services WHERE "tenantId" = $1 ORDER BY "entryDate" DESC LIMIT 1`,
            [tenantId]
        ).catch(() => []);

        return {
            ordersThisMonth: parseInt(ordersMonth[0]?.count || '0'),
            totalOrders: parseInt(totalOrders[0]?.count || '0'),
            activeUsers: parseInt(activeUsers[0]?.count || '0'),
            inventoryItems: parseInt(inventoryItems[0]?.count || '0'),
            lastActivity: lastOrder[0]?.entryDate || null,
        };
    }

    async updateStatus(id: string, status: any) {
        const tenant = await this.tenantsRepository.findOne({ where: { id } });
        if (!tenant) throw new NotFoundException('Tenant não encontrado');
        tenant.status = status;
        return this.tenantsRepository.save(tenant);
    }

    async changePlan(tenantId: string, planId: string) {
        const plan = await this.plansRepository.findOne({ where: { id: planId } });
        if (!plan) throw new NotFoundException('Plano não encontrado');
        const sub = await this.subscriptionsRepository.findOne({ where: { tenantId }, relations: ['plan'] });
        if (!sub) throw new NotFoundException('Assinatura não encontrada para este tenant');
        sub.planId = plan.id;
        sub.plan = plan;
        return this.subscriptionsRepository.save(sub);
    }
}
