import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WarrantyReturn } from './entities/warranty-return.entity';
import { WarrantyRefund } from './entities/warranty-refund.entity';
import { TechnicalMemory } from './entities/technical-memory.entity';
import { OrderService } from '../orders/entities/order-service.entity';
import { OrderHistory } from '../orders/entities/order-history.entity';
import { WarrantiesService } from './warranties.service';
import { WarrantiesController } from './warranties.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            WarrantyReturn,
            WarrantyRefund,
            TechnicalMemory,
            OrderService,
            OrderHistory,
        ]),
    ],
    controllers: [WarrantiesController],
    providers: [WarrantiesService],
    exports: [WarrantiesService],
})
export class WarrantiesModule {}
