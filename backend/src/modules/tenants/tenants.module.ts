import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './entities/tenant.entity';
import { Plan } from './entities/plan.entity';
import { Subscription } from './entities/subscription.entity';
import { SaasModule } from './entities/saas-module.entity';
import { TenantModule } from './entities/tenant-module.entity';
import { TenantsService } from './tenants.service';
import { PlansService } from './plans.service';

@Module({
    imports: [TypeOrmModule.forFeature([Tenant, Plan, Subscription, SaasModule, TenantModule])],
    providers: [TenantsService, PlansService],
    exports: [TenantsService, PlansService, TypeOrmModule],
})
export class TenantsModule {}
