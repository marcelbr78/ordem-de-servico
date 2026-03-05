-- =====================================================================
-- MULTI-TENANT MIGRATION - Adiciona tenant_id nas tabelas principais
-- Execute este script no SQLite antes de iniciar o servidor
-- =====================================================================

-- 1. Adicionar tenant_id em clients
ALTER TABLE clients ADD COLUMN tenantId TEXT;
CREATE INDEX IF NOT EXISTS IDX_clients_tenantId ON clients(tenantId);

-- 2. Adicionar tenant_id em order_services  
ALTER TABLE order_services ADD COLUMN tenantId TEXT;
CREATE INDEX IF NOT EXISTS IDX_order_services_tenantId ON order_services(tenantId);

-- 3. Adicionar tenant_id em order_history
ALTER TABLE order_history ADD COLUMN tenantId TEXT;
CREATE INDEX IF NOT EXISTS IDX_order_history_tenantId ON order_history(tenantId);

-- 4. Adicionar tenant_id em products (inventário)
ALTER TABLE products ADD COLUMN tenantId TEXT;
CREATE INDEX IF NOT EXISTS IDX_products_tenantId ON products(tenantId);

-- 5. Adicionar tenant_id em inventory_stock_movements
ALTER TABLE inventory_stock_movements ADD COLUMN tenantId TEXT;
CREATE INDEX IF NOT EXISTS IDX_inventory_stock_movements_tenantId ON inventory_stock_movements(tenantId);

-- =====================================================================
-- BACKFILL: Preencher com o tenant padrão existente, se houver
-- Substitua o ID abaixo pelo UUID real do tenant principal
-- =====================================================================
-- UPDATE clients SET tenantId = 'SEU-TENANT-UUID-AQUI' WHERE tenantId IS NULL;
-- UPDATE order_services SET tenantId = 'SEU-TENANT-UUID-AQUI' WHERE tenantId IS NULL;
-- UPDATE order_history SET tenantId = 'SEU-TENANT-UUID-AQUI' WHERE tenantId IS NULL;
-- UPDATE products SET tenantId = 'SEU-TENANT-UUID-AQUI' WHERE tenantId IS NULL;
-- UPDATE inventory_stock_movements SET tenantId = 'SEU-TENANT-UUID-AQUI' WHERE tenantId IS NULL;
-- =====================================================================
