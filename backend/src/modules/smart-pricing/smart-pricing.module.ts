import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RepairPricePattern } from './entities/repair-price-pattern.entity';
import { SmartPricingService } from './smart-pricing.service';
import { SmartPricingController } from './smart-pricing.controller';
import { SmartPricingListener } from './smart-pricing.listener';
import { OrderService } from '../orders/entities/order-service.entity';

@Module({
    imports: [TypeOrmModule.forFeature([RepairPricePattern, OrderService])],
    controllers: [SmartPricingController],
    providers: [SmartPricingService, SmartPricingListener],
    exports: [SmartPricingService]
})
export class SmartPricingModule { }
