-- =====================================================================
-- PLANS & SUBSCRIPTIONS MIGRATION
-- Execute este script no SQLite
-- =====================================================================

CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10,2) DEFAULT 0,
    osLimit INTEGER DEFAULT 0,
    usersLimit INTEGER DEFAULT 0,
    storageLimit INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    tenantId TEXT NOT NULL,
    planId TEXT NOT NULL,
    status TEXT DEFAULT 'trial',
    nextBilling DATETIME,
    cancelledAt DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenantId) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (planId) REFERENCES plans(id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS IDX_subscriptions_tenantId ON subscriptions(tenantId);

-- =====================================================================
-- NOTA: Os planos iniciais são inseridos automaticamente pelo
-- PlansService.onModuleInit() ao iniciar o servidor.
-- =====================================================================
