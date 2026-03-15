-- =====================================================================
-- SAAS MODULES MIGRATION — cria tabelas saas_modules e tenant_modules
-- Execute este script no SQLite
-- =====================================================================

CREATE TABLE IF NOT EXISTS saas_modules (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10,2) DEFAULT 0,
    active INTEGER DEFAULT 1,
    isCore INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tenant_modules (
    id TEXT PRIMARY KEY,
    tenantId TEXT NOT NULL,
    moduleId TEXT NOT NULL,
    active INTEGER DEFAULT 1,
    activatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenantId) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (moduleId) REFERENCES saas_modules(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS IDX_tenant_modules_unique ON tenant_modules(tenantId, moduleId);

-- =====================================================================
-- NOTA: Os módulos iniciais são inseridos automaticamente pelo
-- SaasModulesService.onModuleInit() ao iniciar o servidor.
-- Se preferir inserir manualmente, use os INSERTs abaixo:
-- =====================================================================
-- INSERT INTO saas_modules (id, name, description, price, active, isCore)
--   VALUES (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(6))),
--           'core_os', 'Módulo principal de Ordens de Serviço (obrigatório)', 0, 1, 1);
-- (repetir para inventory, whatsapp, smartparts, reports)
-- =====================================================================
