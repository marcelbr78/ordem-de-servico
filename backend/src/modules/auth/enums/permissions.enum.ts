export enum Permission {
    // Usuários
    USER_CREATE = 'user:create',
    USER_READ = 'user:read',
    USER_UPDATE = 'user:update',
    USER_DELETE = 'user:delete',

    // Clientes
    CLIENT_CREATE = 'client:create',
    CLIENT_READ = 'client:read',
    CLIENT_UPDATE = 'client:update',
    CLIENT_DELETE = 'client:delete',

    // Ordem de Serviço
    OS_CREATE = 'os:create',
    OS_READ = 'os:read',
    OS_UPDATE = 'os:update',
    OS_DELETE = 'os:delete',
    OS_APPROVE = 'os:approve',

    // Estoque
    STOCK_READ = 'stock:read',
    STOCK_UPDATE = 'stock:update',

    // Financeiro
    FINANCE_READ = 'finance:read',
    FINANCE_WRITE = 'finance:write',

    // SaaS Master
    SAAS_MANAGE = 'saas:manage',
    SAAS_METRICS = 'saas:metrics',
}

export const RolePermissions: Record<string, Permission[]> = {
    super_admin: Object.values(Permission),
    admin: Object.values(Permission).filter(p => !p.startsWith('saas:')),
    technician: [
        Permission.CLIENT_READ,
        Permission.OS_READ,
        Permission.OS_UPDATE,
        Permission.OS_APPROVE,
        Permission.STOCK_READ,
    ],
    attendant: [
        Permission.CLIENT_CREATE,
        Permission.CLIENT_READ,
        Permission.CLIENT_UPDATE,
        Permission.OS_CREATE,
        Permission.OS_READ,
    ],
};
