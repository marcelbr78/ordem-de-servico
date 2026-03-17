import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { AppModule } from './app.module';
import * as express from 'express';
import * as path from 'path';
import { DataSource } from 'typeorm';

async function bootstrap() {
    // ── Pré-inicializar banco (cria tabelas faltantes antes do NestJS subir) ──
    if (process.env.DB_HOST) {
        try {
            const ds = new DataSource({
                type: 'postgres',
                host: process.env.DB_HOST,
                port: parseInt(process.env.DB_PORT || '5432'),
                username: process.env.DB_USERNAME,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_DATABASE,
                ssl: { rejectUnauthorized: false },
                synchronize: false,
                entities: [],
            });
            await ds.initialize();

            const tables = [
                `CREATE TABLE IF NOT EXISTS "system_settings" ("id" uuid NOT NULL DEFAULT gen_random_uuid(),"key" character varying NOT NULL,"value" text,"type" character varying NOT NULL DEFAULT 'string',"description" character varying,"isPublic" boolean NOT NULL DEFAULT false,"createdAt" TIMESTAMP NOT NULL DEFAULT now(),"updatedAt" TIMESTAMP NOT NULL DEFAULT now(),CONSTRAINT "PK_system_settings" PRIMARY KEY ("id"),CONSTRAINT "UQ_system_settings_key" UNIQUE ("key"))`,
                `CREATE TABLE IF NOT EXISTS "commissions" ("id" uuid NOT NULL DEFAULT gen_random_uuid(),"tenantId" character varying,"technicianId" character varying NOT NULL,"orderId" character varying NOT NULL,"orderProtocol" character varying,"baseValue" numeric(10,2) NOT NULL DEFAULT 0,"ratePercent" numeric(5,2) NOT NULL DEFAULT 0,"commissionValue" numeric(10,2) NOT NULL DEFAULT 0,"basis" text NOT NULL DEFAULT 'service_value',"status" text NOT NULL DEFAULT 'pending',"paidAt" TIMESTAMP,"notes" character varying,"createdAt" TIMESTAMP NOT NULL DEFAULT now(),"updatedAt" TIMESTAMP NOT NULL DEFAULT now(),CONSTRAINT "PK_commissions" PRIMARY KEY ("id"))`,
                `CREATE TABLE IF NOT EXISTS "quote_documents" ("id" uuid NOT NULL DEFAULT gen_random_uuid(),"tenantId" character varying,"orderId" character varying NOT NULL,"version" integer NOT NULL DEFAULT 1,"status" text NOT NULL DEFAULT 'draft',"itemsJson" text NOT NULL DEFAULT '[]',"subtotal" numeric(10,2) NOT NULL DEFAULT 0,"discountPercent" numeric(5,2) NOT NULL DEFAULT 0,"discountValue" numeric(10,2) NOT NULL DEFAULT 0,"total" numeric(10,2) NOT NULL DEFAULT 0,"notes" character varying,"createdAt" TIMESTAMP NOT NULL DEFAULT now(),"updatedAt" TIMESTAMP NOT NULL DEFAULT now(),CONSTRAINT "PK_quote_documents" PRIMARY KEY ("id"))`,
            ];

            const alters = [
                `ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "tags" character varying`,
                `ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "birthday" character varying`,
                `ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "internalNotes" character varying`,
                `ALTER TABLE "order_services" ADD COLUMN IF NOT EXISTS "receiptSignature" text`,
                `ALTER TABLE "order_services" ADD COLUMN IF NOT EXISTS "receiptSignerName" character varying`,
                `ALTER TABLE "order_services" ADD COLUMN IF NOT EXISTS "receiptSignerDoc" character varying`,
                `ALTER TABLE "order_services" ADD COLUMN IF NOT EXISTS "receiptNotes" character varying`,
                `ALTER TABLE "order_services" ADD COLUMN IF NOT EXISTS "receiptAt" TIMESTAMP`,
                `ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'paid'`,
                `ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "dueDate" character varying`,
                `ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "paidDate" character varying`,
                `ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "supplier" character varying`,
                `ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "costCenter" character varying`,
                `ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "documentNumber" character varying`,
                `ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "isRecurring" boolean DEFAULT false`,
                `ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "competenceDate" character varying`,
                `ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "notes" character varying`,
            ];

            for (const sql of [...tables, ...alters]) {
                try { await ds.query(sql); } catch {}
            }
            await ds.destroy();
            console.log('✅ Banco pré-inicializado com sucesso');
        } catch (e) {
            console.warn('⚠️ Pré-init banco:', e.message);
        }
    }

    const app = await NestFactory.create(AppModule);

    app.use(express.static(path.join(process.cwd(), 'public')));

    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    const reflector = app.get(Reflector);
    app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

    const frontendUrl = process.env.FRONTEND_URL;
    const allowedOrigins = frontendUrl
        ? frontendUrl.split(',').map(u => u.trim())
        : true;

    app.enableCors({
        origin: allowedOrigins,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });

    const httpAdapter = app.getHttpAdapter();
    httpAdapter.get('/health', (_req: any, res: any) =>
        res.json({ status: 'ok', ts: new Date() })
    );
    httpAdapter.get('/ping', (_req: any, res: any) =>
        res.json({ pong: true, ts: Date.now() })
    );

    const port = process.env.PORT || 3005;
    await app.listen(port, '0.0.0.0');
    console.log(`🚀 OS4U rodando em: http://0.0.0.0:${port}`);
}
bootstrap();
