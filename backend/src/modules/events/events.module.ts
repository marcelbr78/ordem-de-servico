import { Module, Global } from '@nestjs/common';
import { EventDispatcher } from './event-dispatcher.service';
import { WhatsAppEventListener } from './listeners/whatsapp.listener';
import { AuditEventListener } from './listeners/audit.listener';
import { MetricsEventListener } from './listeners/metrics.listener';

@Global()
@Module({
    providers: [
        EventDispatcher,
        WhatsAppEventListener,
        AuditEventListener,
        MetricsEventListener,
    ],
    exports: [EventDispatcher],
})
export class EventsModule { }
