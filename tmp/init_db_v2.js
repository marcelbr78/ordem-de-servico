const { Client } = require('pg');

const connectionString = 'postgresql://os4u_db_vip3_user:A148fkZy4OI1bcZS57SBurAHTlP9kFIl@dpg-d6rgudnpm1nc73bjucq0-a.oregon-postgres.render.com/os4u_db_vip3';

const client = new Client({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

const sqlCommands = `
-- Criar tabela system_settings se não existir
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
);

-- Criar tabela commissions se não existir
CREATE TABLE IF NOT EXISTS "commissions" (
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
);

-- Criar tabela quote_documents se não existir
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
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "PK_quote_documents" PRIMARY KEY ("id")
);

-- Adicionar colunas novas nas tabelas existentes
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE "clients" ADD COLUMN "tags" character varying;
    EXCEPTION WHEN duplicate_column THEN 
        RAISE NOTICE 'column tags already exists in clients';
    END;
    
    BEGIN
        ALTER TABLE "clients" ADD COLUMN "birthday" character varying;
    EXCEPTION WHEN duplicate_column THEN 
        RAISE NOTICE 'column birthday already exists in clients';
    END;
    
    BEGIN
        ALTER TABLE "clients" ADD COLUMN "internalNotes" character varying;
    EXCEPTION WHEN duplicate_column THEN 
        RAISE NOTICE 'column internalNotes already exists in clients';
    END;

    BEGIN
        ALTER TABLE "order_services" ADD COLUMN "receiptSignature" text;
    EXCEPTION WHEN duplicate_column THEN 
        RAISE NOTICE 'column receiptSignature already exists in order_services';
    END;
    
    BEGIN
        ALTER TABLE "order_services" ADD COLUMN "receiptSignerName" character varying;
    EXCEPTION WHEN duplicate_column THEN 
        RAISE NOTICE 'column receiptSignerName already exists in order_services';
    END;
    
    BEGIN
        ALTER TABLE "order_services" ADD COLUMN "receiptSignerDoc" character varying;
    EXCEPTION WHEN duplicate_column THEN 
        RAISE NOTICE 'column receiptSignerDoc already exists in order_services';
    END;
    
    BEGIN
        ALTER TABLE "order_services" ADD COLUMN "receiptNotes" character varying;
    EXCEPTION WHEN duplicate_column THEN 
        RAISE NOTICE 'column receiptNotes already exists in order_services';
    END;
    
    BEGIN
        ALTER TABLE "order_services" ADD COLUMN "receiptAt" TIMESTAMP;
    EXCEPTION WHEN duplicate_column THEN 
        RAISE NOTICE 'column receiptAt already exists in order_services';
    END;

    BEGIN
        ALTER TABLE "transactions" ADD COLUMN "status" text DEFAULT 'paid';
    EXCEPTION WHEN duplicate_column THEN 
        RAISE NOTICE 'column status already exists in transactions';
    END;
    
    BEGIN
        ALTER TABLE "transactions" ADD COLUMN "dueDate" character varying;
    EXCEPTION WHEN duplicate_column THEN 
        RAISE NOTICE 'column dueDate already exists in transactions';
    END;
    
    BEGIN
        ALTER TABLE "transactions" ADD COLUMN "paidDate" character varying;
    EXCEPTION WHEN duplicate_column THEN 
        RAISE NOTICE 'column paidDate already exists in transactions';
    END;
    
    BEGIN
        ALTER TABLE "transactions" ADD COLUMN "supplier" character varying;
    EXCEPTION WHEN duplicate_column THEN 
        RAISE NOTICE 'column supplier already exists in transactions';
    END;
    
    BEGIN
        ALTER TABLE "transactions" ADD COLUMN "costCenter" character varying;
    EXCEPTION WHEN duplicate_column THEN 
        RAISE NOTICE 'column costCenter already exists in transactions';
    END;
    
    BEGIN
        ALTER TABLE "transactions" ADD COLUMN "documentNumber" character varying;
    EXCEPTION WHEN duplicate_column THEN 
        RAISE NOTICE 'column documentNumber already exists in transactions';
    END;
    
    BEGIN
        ALTER TABLE "transactions" ADD COLUMN "isRecurring" boolean DEFAULT false;
    EXCEPTION WHEN duplicate_column THEN 
        RAISE NOTICE 'column isRecurring already exists in transactions';
    END;
    
    BEGIN
        ALTER TABLE "transactions" ADD COLUMN "competenceDate" character varying;
    EXCEPTION WHEN duplicate_column THEN 
        RAISE NOTICE 'column competenceDate already exists in transactions';
    END;
    
    BEGIN
        ALTER TABLE "transactions" ADD COLUMN "notes" character varying;
    EXCEPTION WHEN duplicate_column THEN 
        RAISE NOTICE 'column notes already exists in transactions';
    END;

    BEGIN
        ALTER TABLE "inventory_stock_movements" ADD COLUMN "reason" character varying;
    EXCEPTION WHEN duplicate_column THEN 
        RAISE NOTICE 'column reason already exists in inventory_stock_movements';
    END;
    
    BEGIN
        ALTER TABLE "inventory_stock_movements" ADD COLUMN "invoiceNumber" character varying;
    EXCEPTION WHEN duplicate_column THEN 
        RAISE NOTICE 'column invoiceNumber already exists in inventory_stock_movements';
    END;
END $$;
`;

async function initDb() {
  try {
    await client.connect();
    console.log('Connected to the database.');
    await client.query(sqlCommands);
    console.log('SQL commands executed successfully.');
  } catch (err) {
    console.error('Error executing SQL:', err.stack);
  } finally {
    await client.end();
  }
}

initDb();
