import { MigrationInterface, QueryRunner } from 'typeorm';

export class NewFeatures1742000000000 implements MigrationInterface {
    name = 'NewFeatures1742000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {

        // ── commissions ──────────────────────────────────────────
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "commissions" (
                "id"               uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId"         character varying,
                "technicianId"     character varying NOT NULL,
                "orderId"          character varying NOT NULL,
                "orderProtocol"    character varying,
                "baseValue"        numeric(10,2) NOT NULL,
                "ratePercent"      numeric(5,2)  NOT NULL,
                "commissionValue"  numeric(10,2) NOT NULL,
                "basis"            text NOT NULL DEFAULT 'service_value',
                "status"           text NOT NULL DEFAULT 'pending',
                "paymentPeriod"    character varying,
                "paidAt"           TIMESTAMP,
                "notes"            character varying,
                "createdAt"        TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt"        TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_commissions" PRIMARY KEY ("id")
            )
        `);

        // ── quote_documents ──────────────────────────────────────
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "quote_documents" (
                "id"               uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId"         character varying,
                "orderId"          character varying NOT NULL,
                "version"          integer NOT NULL DEFAULT 1,
                "status"           text NOT NULL DEFAULT 'draft',
                "validUntil"       character varying,
                "itemsJson"        text NOT NULL DEFAULT '[]',
                "subtotal"         numeric(10,2) NOT NULL DEFAULT 0,
                "discountPercent"  numeric(5,2)  NOT NULL DEFAULT 0,
                "discountValue"    numeric(10,2) NOT NULL DEFAULT 0,
                "total"            numeric(10,2) NOT NULL DEFAULT 0,
                "paymentCondition" character varying,
                "deliveryDays"     integer,
                "warrantyDays"     integer,
                "notes"            character varying,
                "approvedAt"       TIMESTAMP,
                "approvedByName"   character varying,
                "rejectedAt"       TIMESTAMP,
                "rejectionReason"  character varying,
                "sentAt"           TIMESTAMP,
                "sentByUserId"     character varying,
                "createdAt"        TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt"        TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_quote_documents" PRIMARY KEY ("id")
            )
        `);

        // ── transactions — colunas novas ─────────────────────────
        await queryRunner.query(`ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "status"           text NOT NULL DEFAULT 'paid'`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "dueDate"          character varying`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "paidDate"         character varying`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "competenceDate"   character varying`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "supplier"         character varying`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "costCenter"       character varying`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "notes"            character varying`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "documentNumber"   character varying`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "isRecurring"      boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "recurrenceType"   character varying`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "recurrenceId"     character varying`);

        // ── clients — colunas novas ──────────────────────────────
        await queryRunner.query(`ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "tags"          character varying`);
        await queryRunner.query(`ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "birthday"      character varying`);
        await queryRunner.query(`ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "internalNotes" character varying`);

        // ── order_services — colunas novas ───────────────────────
        await queryRunner.query(`ALTER TABLE "order_services" ADD COLUMN IF NOT EXISTS "receiptSignature"  text`);
        await queryRunner.query(`ALTER TABLE "order_services" ADD COLUMN IF NOT EXISTS "receiptSignerName" character varying`);
        await queryRunner.query(`ALTER TABLE "order_services" ADD COLUMN IF NOT EXISTS "receiptSignerDoc"  character varying`);
        await queryRunner.query(`ALTER TABLE "order_services" ADD COLUMN IF NOT EXISTS "receiptNotes"      character varying`);
        await queryRunner.query(`ALTER TABLE "order_services" ADD COLUMN IF NOT EXISTS "receiptAt"         TIMESTAMP`);

        // ── inventory_stock_movements — colunas extras ───────────
        await queryRunner.query(`ALTER TABLE "inventory_stock_movements" ADD COLUMN IF NOT EXISTS "reason"        character varying`);
        await queryRunner.query(`ALTER TABLE "inventory_stock_movements" ADD COLUMN IF NOT EXISTS "invoiceNumber"  character varying`);
        await queryRunner.query(`ALTER TABLE "inventory_stock_movements" ADD COLUMN IF NOT EXISTS "supplierId"     character varying`);

        // ── clients — coluna cpfCnpj pode ter constraint unique problemática ─
        // (seguro: IF NOT EXISTS já cuida de duplicatas)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "commissions"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "quote_documents"`);
        // colunas: reversão manual se necessário
    }
}
