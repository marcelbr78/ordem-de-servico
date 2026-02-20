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
    constructor(private readonly settingsService: SettingsService) { }

    async onModuleInit() {
        await this.settingsService.seedDefaults();
    }
}
