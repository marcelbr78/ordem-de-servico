import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { OrderService } from './entities/order-service.entity';
import { OrderPart } from './entities/order-part.entity';
import { Transaction } from '../finance/entities/transaction.entity';

@Module({
    imports: [TypeOrmModule.forFeature([OrderService, OrderPart, Transaction])],
    controllers: [ReportsController],
})
export class ReportsModule {}
