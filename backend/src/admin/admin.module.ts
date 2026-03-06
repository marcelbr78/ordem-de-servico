import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { DashboardController } from './dashboard/dashboard.controller';
import { DashboardService } from './dashboard/dashboard.service';
import { TenantsController } from './tenants/tenants.controller';
import { TenantsService } from './tenants/tenants.service';
import { PlansController } from './plans/plans.controller';
import { PlansService } from './plans/plans.service';
import { SubscriptionsController } from './subscriptions/subscriptions.controller';
import { SubscriptionsService } from './subscriptions/subscriptions.service';

// Reusing global master entities
import { Tenant } from '../modules/tenants/entities/tenant.entity';
import { Plan } from '../modules/tenants/entities/plan.entity';
import { Subscription } from '../modules/tenants/entities/subscription.entity';
import { User } from '../modules/users/entities/user.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Tenant, Plan, Subscription, User]),
        ThrottlerModule.forRoot([{
            ttl: 60000, // 60 seconds
            limit: 30, // Limit each IP to 30 requests per 'ttl' in the admin namespace
        }]),
    ],
    controllers: [
        DashboardController,
        TenantsController,
        PlansController,
        SubscriptionsController
    ],
    providers: [
        DashboardService,
        TenantsService,
        PlansService,
        SubscriptionsService,
    ],
})
export class AdminModule { }
