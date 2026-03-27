import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventDispatcher } from './event-dispatcher.service';
import { WhatsAppEventListener } from './listeners/whatsapp.listener';
import { AuditEventListener } from './listeners/audit.listener';
import { MetricsEventListener } from './listeners/metrics.listener';
import { CommissionEventListener } from './listeners/commission.listener';
import { FinanceEventListener } from './listeners/finance.listener';
import { StockEventListener } from './listeners/stock.listener';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { SettingsModule } from '../settings/settings.module';
import { CommissionsModule } from '../commissions/commissions.module';
import { FinanceModule } from '../finance/finance.module';
import { InventoryModule } from '../inventory/inventory.module';
import { OrderService } from '../orders/entities/order-service.entity';
import { OrderPart } from '../orders/entities/order-part.entity';

@Global()
@Module({
    imports: [
        TypeOrmModule.forFeature([OrderService, OrderPart]),
        WhatsappModule,
        SettingsModule,
        CommissionsModule,
        FinanceModule,
        InventoryModule,
    ],
    providers: [
        EventDispatcher,
        WhatsAppEventListener,
        AuditEventListener,
        MetricsEventListener,
        CommissionEventListener,
        FinanceEventListener,
        StockEventListener,
    ],
    exports: [EventDispatcher],
})
export class EventsModule { }
