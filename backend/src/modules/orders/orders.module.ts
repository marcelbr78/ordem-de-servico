import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrderService } from './entities/order-service.entity';

import { ClientsModule } from '../clients/clients.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([OrderService]),
        ClientsModule,
    ],
    controllers: [OrdersController],
    providers: [OrdersService],
    exports: [OrdersService],
})
export class OrdersModule { }
