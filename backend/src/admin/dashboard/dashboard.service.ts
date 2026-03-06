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

        // Calculate global MRR only from ACTIVE subscriptions
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
}
