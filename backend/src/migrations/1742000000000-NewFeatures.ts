import { MigrationInterface, QueryRunner } from 'typeorm';

export class NewFeatures1742000000000 implements MigrationInterface {
    name = 'NewFeatures1742000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
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

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "commissions" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "tenantId" character varying,
                "technicianId" character varying NOT NULL,
                "orderId" character varying NOT NULL,
                "orderProtocol" character varying,
                "baseValue" numeric(10,2) NOT NULL DEFAULT 0,
                "ratePercent" numeric(5,2) NOT NULL DEFAULT 0,
                "commissionValue" numeric(10,2) NOT NULL DEFAULT 0,
                "basis" text NOT NULL DEFAULT 'service_value',
                "status" text NOT NULL DEFAULT 'pending',
                "paidAt" TIMESTAMP,
                "notes" character varying,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_commissions" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "quote_documents" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "tenantId" character varying,
                "orderId" character varying NOT NULL,
                "version" integer NOT NULL DEFAULT 1,
                "status" text NOT NULL DEFAULT 'draft',
                "itemsJson" text NOT NULL DEFAULT '[]',
                "subtotal" numeric(10,2) NOT NULL DEFAULT 0,
                "discountPercent" numeric(5,2) NOT NULL DEFAULT 0,
                "discountValue" numeric(10,2) NOT NULL DEFAULT 0,
                "total" numeric(10,2) NOT NULL DEFAULT 0,
                "notes" character varying,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_quote_documents" PRIMARY KEY ("id")
            )
        `);

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

        for (const sql of alters) {
            await queryRunner.query(sql).catch(() => {});
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "commissions"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "quote_documents"`);
        // colunas: reversão manual se necessário
    }
}
