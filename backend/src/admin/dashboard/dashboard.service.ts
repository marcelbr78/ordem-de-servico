import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant, TenantStatus } from '../../modules/tenants/entities/tenant.entity';
import { Subscription, SubscriptionStatus } from '../../modules/tenants/entities/subscription.entity';
import { User } from '../../modules/users/entities/user.entity';

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(Tenant)
        private tenantsRepository: Repository<Tenant>,
        @InjectRepository(Subscription)
        private subscriptionsRepository: Repository<Subscription>,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    async getStats() {
        const totalTenants = await this.tenantsRepository.count();
        const activeTenants = await this.tenantsRepository.count({ where: { status: TenantStatus.ACTIVE } });
        const globalUsers = await this.usersRepository.count();

        const activeSubscriptions = await this.subscriptionsRepository.find({
            where: { status: SubscriptionStatus.ACTIVE },
            relations: ['plan']
        });

        const activeMrr = activeSubscriptions.reduce((acc, sub) => {
            return acc + (Number(sub.plan?.price) || 0);
        }, 0);

        return {
            totalTenants,
            activeTenants,
            globalUsers,
            activeMrr,
        };
    }

    async getMrrChart() {
        // Returns last 6 months of MRR based on active subscriptions created per month
        const allSubs = await this.subscriptionsRepository.find({
            where: { status: SubscriptionStatus.ACTIVE },
            relations: ['plan'],
            order: { createdAt: 'ASC' }
        });

        const months: { month: string; mrr: number; tenants: number }[] = [];
        const now = new Date();

        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const label = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });

            // Count subscriptions active as of this month (created on or before end of month)
            const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
            const activeThatMonth = allSubs.filter(s => new Date(s.createdAt) <= endOfMonth);

            const mrr = activeThatMonth.reduce((acc, sub) => acc + (Number(sub.plan?.price) || 0), 0);
            months.push({ month: label, mrr: Math.round(mrr * 100) / 100, tenants: activeThatMonth.length });
        }

        return months;
    }
}

