import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';

import { DashboardController } from './dashboard/dashboard.controller';
import { DashboardService } from './dashboard/dashboard.service';
import { HealthService } from './dashboard/health.service';
import { TenantsController } from './tenants/tenants.controller';
import { TenantsService } from './tenants/tenants.service';
import { PlansController } from './plans/plans.controller';
import { PlansService } from './plans/plans.service';
import { SubscriptionsController, BillingWebhookController } from './subscriptions/subscriptions.controller';
import { SupportController, TenantSupportController } from './support/support.controller';
import { BroadcastsController } from './broadcasts/broadcasts.controller';
import { FeatureFlagsController } from './feature-flags/feature-flags.controller';
import { Broadcast } from './broadcasts/broadcast.entity';
import { FeatureFlag } from './feature-flags/feature-flag.entity';
import { SupportTicket, TicketMessage } from './support/support-ticket.entity';
import { SubscriptionsService } from './subscriptions/subscriptions.service';

import { Tenant } from '../modules/tenants/entities/tenant.entity';
import { AuditLog } from '../modules/audit/entities/audit-log.entity';
import { WhatsappModule } from '../modules/whatsapp/whatsapp.module';
import { Plan } from '../modules/tenants/entities/plan.entity';
import { Subscription } from '../modules/tenants/entities/subscription.entity';
import { User } from '../modules/users/entities/user.entity';

@Module({
    imports: [
        ConfigModule,
        ScheduleModule.forRoot(),
        WhatsappModule,
        TypeOrmModule.forFeature([Tenant, Plan, Subscription, User, AuditLog, SupportTicket, TicketMessage, Broadcast, FeatureFlag]),
        ThrottlerModule.forRoot([{ ttl: 60000, limit: 30 }]),
    ],
    controllers: [
        SupportController, TenantSupportController,
        DashboardController,
        TenantsController,
        PlansController,
        SubscriptionsController,
        BillingWebhookController,
        BroadcastsController, FeatureFlagsController,
    ],
    providers: [
        HealthService,
        DashboardService,
        TenantsService,
        PlansService,
        SubscriptionsService,
    ],
})
export class AdminModule {}
// Patch: ensure new controllers/entities are listed — this gets appended
