import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../../modules/tenants/entities/tenant.entity';
import { Subscription } from '../../modules/tenants/entities/subscription.entity';
import { Plan } from '../../modules/tenants/entities/plan.entity';

@Injectable()
export class TenantsService {
    constructor(
        @InjectRepository(Tenant)
        private tenantsRepository: Repository<Tenant>,
        @InjectRepository(Subscription)
        private subscriptionsRepository: Repository<Subscription>,
        @InjectRepository(Plan)
        private plansRepository: Repository<Plan>,
    ) { }

    async findAll(page: number = 1, limit: number = 20) {
        const [items, total] = await this.tenantsRepository.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
            order: { createdAt: 'DESC' }
        });

        // Enrich with subscriptions
        const tenantIds = items.map(t => t.id);
        const subscriptions = tenantIds.length > 0
            ? await this.subscriptionsRepository.find({
                where: tenantIds.map(id => ({ tenantId: id })),
                relations: ['plan']
            })
            : [];

        const subMap = new Map(subscriptions.map(s => [s.tenantId, s]));

        const enriched = items.map(t => ({
            ...t,
            subscription: subMap.get(t.id) ?? null,
        }));

        return {
            data: enriched,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async findOne(id: string) {
        const tenant = await this.tenantsRepository.findOne({ where: { id } });
        if (!tenant) throw new NotFoundException('Tenant não encontrado');
        const subscription = await this.subscriptionsRepository.findOne({
            where: { tenantId: id },
            relations: ['plan']
        });
        return { ...tenant, subscription: subscription ?? null };
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

        let sub = await this.subscriptionsRepository.findOne({ where: { tenantId }, relations: ['plan'] });
        if (!sub) throw new NotFoundException('Assinatura não encontrada para este tenant');

        sub.planId = plan.id;
        sub.plan = plan;
        return this.subscriptionsRepository.save(sub);
    }
}
