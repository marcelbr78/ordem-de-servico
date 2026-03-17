import { Module, Global } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { SettingsModule } from '../settings/settings.module';
import { Tenant } from '../tenants/entities/tenant.entity';

@Global()
@Module({
    imports: [SettingsModule, ScheduleModule.forRoot(), TypeOrmModule.forFeature([Tenant])],
    controllers: [WhatsappController],
    providers: [WhatsappService],
    exports: [WhatsappService],
})
export class WhatsappModule { }
