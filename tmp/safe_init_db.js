const { Client } = require('pg');

const connectionString = 'postgresql://os4u_db_vip3_user:A148fkZy4OI1bcZS57SBurAHTlP9kFIl@dpg-d6rgudnpm1nc73bjucq0-a.oregon-postgres.render.com/os4u_db_vip3';

const client = new Client({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

const sqls = [
  // Drop index requested earlier
  'DROP INDEX IF EXISTS "IDX_8ec1a80842519855fbe77a14b5";',

  // Criar tabela system_settings se não existir
  `CREATE TABLE IF NOT EXISTS "system_settings" (
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
  );`,

  // Criar tabela commissions se não existir
  `CREATE TABLE IF NOT EXISTS "commissions" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" character varying,
    "technicianId" character varying NOT NULL,
    "orderId" character varying NOT NULL,
    "baseValue" numeric(10,2) NOT NULL DEFAULT 0,
    "ratePercent" numeric(5,2) NOT NULL DEFAULT 0,
    "commissionValue" numeric(10,2) NOT NULL DEFAULT 0,
    "basis" text NOT NULL DEFAULT 'service_value',
    "status" text NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "PK_commissions" PRIMARY KEY ("id")
  );`,

  // Criar tabela quote_documents se não existir
  `CREATE TABLE IF NOT EXISTS "quote_documents" (
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
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "PK_quote_documents" PRIMARY KEY ("id")
  );`,

  // Adicionar colunas novas nas tabelas existentes (wrapped in try/catch in the loop)
  'ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "tags" character varying;',
  'ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "birthday" character varying;',
  'ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "internalNotes" character varying;',

  'ALTER TABLE "order_services" ADD COLUMN IF NOT EXISTS "receiptSignature" text;',
  'ALTER TABLE "order_services" ADD COLUMN IF NOT EXISTS "receiptSignerName" character varying;',
  'ALTER TABLE "order_services" ADD COLUMN IF NOT EXISTS "receiptSignerDoc" character varying;',
  'ALTER TABLE "order_services" ADD COLUMN IF NOT EXISTS "receiptNotes" character varying;',
  'ALTER TABLE "order_services" ADD COLUMN IF NOT EXISTS "receiptAt" TIMESTAMP;',

  "ALTER TABLE \"transactions\" ADD COLUMN IF NOT EXISTS \"status\" text DEFAULT 'paid';",
  'ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "dueDate" character varying;',
  'ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "paidDate" character varying;',
  'ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "supplier" character varying;',
  'ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "costCenter" character varying;',
  'ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "documentNumber" character varying;',
  'ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "isRecurring" boolean DEFAULT false;',
  'ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "competenceDate" character varying;',
  'ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "notes" character varying;',

  'ALTER TABLE "inventory_stock_movements" ADD COLUMN IF NOT EXISTS "reason" character varying;',
  'ALTER TABLE "inventory_stock_movements" ADD COLUMN IF NOT EXISTS "invoiceNumber" character varying;'
];

async function run() {
  try {
    await client.connect();
    console.log('Connected to the database.');
    
    // Enable uuid-ossp extension for gen_random_uuid or uuid_generate_v4
    try {
        await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
        console.log('PGCRYPTO extension enabled.');
    } catch (e) {
        console.log('Note: could not enable pgcrypto, might be already active or perm denied.');
    }

    for (const sql of sqls) {
      try {
        await client.query(sql);
        console.log('Executed:', sql.substring(0, 50) + '...');
      } catch (err) {
        if (err.code === '42P01') { // undefined_table
          console.warn('Skipping (table does not exist yet):', sql.substring(0, 50));
        } else {
          console.error('Error executing:', sql.substring(0, 50), err.message);
        }
      }
    }
    console.log('Done.');
  } catch (err) {
    console.error('Fatal error:', err.stack);
  } finally {
    await client.end();
  }
}

run();
