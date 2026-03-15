import api from './api';

export interface AdminDashboardMetrics {
    totalTenants: number;
    activeSubscriptions?: number;
    activeTenants?: number;
    activeMrr?: number;
    globalUsers?: number;
    mrr?: number;
    ordersToday?: number;
}

export interface TenantAdminDto {
    id: string;
    storeName?: string;
    name?: string;
    subdomain: string;
    status: string;
    createdAt: string;
    subscription?: {
        status: string;
        nextBilling?: string;
        plan?: {
            id: string; name: string; price: number;
            osLimit: number; usersLimit: number; storageLimit: number;
        };
    };
    ownerName?: string;
    email?: string;
    cnpj?: string;
    phone?: string;
}

export interface SubscriptionAdminDto {
    tenantId: string; tenantName: string; planName: string;
    monthlyPrice: number; status: string; nextBillingDate: string;
}

export interface PlanDto {
    id: string; name: string; description: string; price: number;
    osLimit: number; usersLimit: number; storageLimit: number;
    active: boolean; createdAt?: string;
}

export const adminService = {
    getDashboard: async (): Promise<AdminDashboardMetrics> => {
        const r = await api.get('/admin/dashboard/stats'); return r.data;
    },
    getTenants: async (page = 1, limit = 100) => {
        const r = await api.get('/admin/tenants', { params: { page, limit } });
        return r.data;
    },
    getTenantById: async (id: string): Promise<TenantAdminDto> => {
        const r = await api.get(`/admin/tenants/${id}`); return r.data;
    },
    getTenantMetrics: async (id: string): Promise<{
        ordersThisMonth: number; totalOrders: number;
        activeUsers: number; inventoryItems: number; lastActivity: string | null;
    }> => {
        const r = await api.get(`/admin/tenants/${id}/metrics`); return r.data;
    },
    updateTenantStatus: async (id: string, status: string): Promise<void> => {
        await api.patch(`/admin/tenants/${id}/status`, { status });
    },
    changeTenantPlan: async (tenantId: string, planId: string): Promise<void> => {
        await api.patch(`/admin/tenants/${tenantId}/plan`, { planId });
    },
    getSubscriptions: async (): Promise<SubscriptionAdminDto[]> => {
        const r = await api.get('/admin/subscriptions'); return r.data;
    },
    updateSubscriptionPlan: async (tenantId: string, planId: string): Promise<void> => {
        await api.patch(`/admin/subscriptions/${tenantId}/plan`, { planId });
    },
    getPlans: async (): Promise<PlanDto[]> => {
        const r = await api.get('/admin/plans'); return r.data;
    },
    createPlan: async (data: Partial<PlanDto>): Promise<PlanDto> => {
        const r = await api.post('/admin/plans', data); return r.data;
    },
    updatePlan: async (id: string, data: Partial<PlanDto>): Promise<PlanDto> => {
        const r = await api.patch(`/admin/plans/${id}`, data); return r.data;
    },
    deletePlan: async (id: string): Promise<void> => {
        await api.delete(`/admin/plans/${id}`);
    },
    getMrrChart: async (): Promise<{ month: string; mrr: number; tenants: number }[]> => {
        const r = await api.get('/admin/dashboard/mrr-chart'); return r.data;
    },
};
