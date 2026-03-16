import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { SystemSetting } from './entities/setting.entity';
import { DataSource } from 'typeorm';

@Module({
    imports: [TypeOrmModule.forFeature([SystemSetting])],
    controllers: [SettingsController],
    providers: [SettingsService],
    exports: [SettingsService],
})
export class SettingsModule implements OnModuleInit {
    constructor(
        private readonly settingsService: SettingsService,
        private readonly dataSource: DataSource,
    ) {}

    async onModuleInit() {
        try {
            // Criar tabela se não existir antes de usar
            await this.dataSource.query(`
                CREATE TABLE IF NOT EXISTS "system_settings" (
                    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                    "key" character varying NOT NULL,
                    "value" text,
                    "type" character varying NOT NULL DEFAULT 'string',
                    "description" character varying,
                    "isPublic" boolean NOT NULL DEFAULT false,
                    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                    CONSTRAINT "PK_system_settings" PRIMARY KEY ("id"),
                    CONSTRAINT "UQ_system_settings_key" UNIQUE ("key")
                )
            `);
            await this.settingsService.seedDefaults();
        } catch (e) {
            console.warn('⚠️ SettingsModule init:', e.message);
        }
    }
}
