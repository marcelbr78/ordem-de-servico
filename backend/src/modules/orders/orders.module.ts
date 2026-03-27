import { Module, forwardRef } from '@nestjs/common';
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
import { OrderConversation } from './entities/order-conversation.entity';
import { OrderServiceItem } from './entities/order-service-item.entity';
import { OrderServiceItemsController } from './order-service-items.controller';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { ClientsModule } from '../clients/clients.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { SettingsModule } from '../settings/settings.module';
import { OrderPdfService } from './pdf/order-pdf.service';
import { TenantsModule } from '../tenants/tenants.module';
import { PlansService } from '../tenants/plans.service';
import { Plan } from '../tenants/entities/plan.entity';
import { ConversationService } from './conversation.service';
import { OrderNotificationService } from './order-notification.service';
import { SmartPartsModule } from '../smartparts/smartparts.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            OrderService, OrderEquipment, OrderHistory,
            OrderPhoto, OrderPart, OrderConversation, Plan, OrderServiceItem,
        ]),
        WhatsappModule, ClientsModule,
        CloudinaryModule, SettingsModule, TenantsModule,
        forwardRef(() => SmartPartsModule),
    ],
    controllers: [OrdersController, PublicOrdersController, OrderServiceItemsController],
    providers: [OrdersService, LookupService, OrderPdfService, PlansService, ConversationService, OrderNotificationService],
    exports: [OrdersService, ConversationService],
})
export class OrdersModule {}
