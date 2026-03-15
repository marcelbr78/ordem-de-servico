import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { SystemSetting } from './entities/setting.entity';

@Module({
    imports: [TypeOrmModule.forFeature([SystemSetting])],
    controllers: [SettingsController],
    providers: [SettingsService],
    exports: [SettingsService],
})
export class SettingsModule implements OnModuleInit {
    constructor(private readonly settingsService: SettingsService) {}

    async onModuleInit() {
        try {
            await this.settingsService.seedDefaults();
        } catch (e) {
            console.warn('⚠️ Settings seed ignorado (banco ainda não pronto):', e.message);
        }
    }
}
