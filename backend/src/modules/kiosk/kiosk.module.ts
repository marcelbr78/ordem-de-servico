import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KioskService } from './kiosk.service';
import { KioskController } from './kiosk.controller';
import { Tenant } from '../tenants/entities/tenant.entity';
import { Client } from '../clients/entities/client.entity';
import { ClientContact } from '../clients/entities/client-contact.entity';
import { OrderService } from '../orders/entities/order-service.entity';
import { OrderEquipment } from '../orders/entities/order-equipment.entity';
import { OrderHistory } from '../orders/entities/order-history.entity';
import { User } from '../users/entities/user.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Tenant,
            Client,
            ClientContact,
            OrderService,
            OrderEquipment,
            OrderHistory,
            User,
        ]),
    ],
    controllers: [KioskController],
    providers: [KioskService],
})
export class KioskModule {}
