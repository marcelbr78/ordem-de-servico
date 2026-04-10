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
            if (this.dataSource.options.type === 'postgres') {
                // Garante que a tabela existe com a estrutura base
                await this.dataSource.query(`
                    CREATE TABLE IF NOT EXISTS "system_settings" (
                        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                        "tenantId" character varying,
                        "key" character varying NOT NULL,
                        "value" text,
                        "type" character varying NOT NULL DEFAULT 'string',
                        "description" character varying,
                        "isPublic" boolean NOT NULL DEFAULT false,
                        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                        CONSTRAINT "PK_system_settings" PRIMARY KEY ("id")
                    )
                `);

                // Adiciona tenantId se a tabela já existia sem ela
                await this.dataSource.query(
                    `ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "tenantId" character varying`
                ).catch(() => {});

                // Remove constraint única global (key) — incompatível com multi-tenant
                await this.dataSource.query(
                    `ALTER TABLE "system_settings" DROP CONSTRAINT IF EXISTS "UQ_system_settings_key"`
                ).catch(() => {});

                // Adiciona índice único por (tenantId, key) — apenas quando tenantId não é nulo
                await this.dataSource.query(`
                    CREATE UNIQUE INDEX IF NOT EXISTS "UQ_system_settings_tenant_key"
                    ON "system_settings" ("tenantId", "key")
                    WHERE "tenantId" IS NOT NULL
                `).catch(() => {});
            }
        } catch (e) {
            console.warn('⚠️ SettingsModule init:', e.message);
        }
    }
}
