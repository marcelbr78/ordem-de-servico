import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { LookupService } from './lookup.service';
import { OrdersController } from './orders.controller';
import { PublicOrdersController } from './public-orders.controller';
import { OrderService } from './entities/order-service.entity';
import { OrderEquipment } from './entities/order-equipment.entity';
import { OrderHistory } from './entities/order-history.entity';
import { OrderPhoto } from './entities/order-photo.entity';
import { OrderPart } from './entities/order-part.entity';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { ClientsModule } from '../clients/clients.module';
import { InventoryModule } from '../inventory/inventory.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { SettingsModule } from '../settings/settings.module';
import { FinanceModule } from '../finance/finance.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            OrderService,
            OrderEquipment,
            OrderHistory,
            OrderPhoto,
            OrderPart
        ]),
        WhatsappModule,
        ClientsModule,
        InventoryModule,
        CloudinaryModule,
        SettingsModule,
        FinanceModule
    ],
    controllers: [OrdersController, PublicOrdersController],
    providers: [OrdersService, LookupService],
    exports: [OrdersService],
})
export class OrdersModule { }
