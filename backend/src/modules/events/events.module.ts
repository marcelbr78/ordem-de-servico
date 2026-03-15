import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventDispatcher } from './event-dispatcher.service';
import { WhatsAppEventListener } from './listeners/whatsapp.listener';
import { AuditEventListener } from './listeners/audit.listener';
import { MetricsEventListener } from './listeners/metrics.listener';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { SettingsModule } from '../settings/settings.module';
import { OrderService } from '../orders/entities/order-service.entity';

@Global()
@Module({
    imports: [
        TypeOrmModule.forFeature([OrderService]),
        WhatsappModule,
        SettingsModule,
    ],
    providers: [
        EventDispatcher,
        WhatsAppEventListener,
        AuditEventListener,
        MetricsEventListener,
    ],
    exports: [EventDispatcher],
})
export class EventsModule { }
