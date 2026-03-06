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
        plan?: {
            id: string;
            name: string;
            price: number;
            osLimit: number;
            usersLimit: number;
            storageLimit: number;
        }
    };
    ownerName?: string;
    email?: string;
    cnpj?: string;
}

export interface SubscriptionAdminDto {
    tenantId: string;
    tenantName: string;
    planName: string;
    monthlyPrice: number;
    status: string;
    nextBillingDate: string;
}

export interface PlanDto {
    id: string;
    name: string;
    description: string;
    price: number;
    osLimit: number;      // 0 = unlimited
    usersLimit: number;   // 0 = unlimited
    storageLimit: number; // inventory items limit (named storageLimit in entity)
    active: boolean;
    createdAt?: string;
}

export const adminService = {
    getDashboard: async (): Promise<AdminDashboardMetrics> => {
        const response = await api.get('/admin/dashboard/stats');
        return response.data;
    },

    getTenants: async (page: number = 1, limit: number = 100): Promise<{ data: TenantAdminDto[], meta: { total: number } }> => {
        const response = await api.get('/admin/tenants', { params: { page, limit } });
        return response.data;
    },

    updateTenantStatus: async (id: string, status: string): Promise<void> => {
        await api.patch(`/admin/tenants/${id}/status`, { status });
    },

    changeTenantPlan: async (tenantId: string, planId: string): Promise<void> => {
        await api.patch(`/admin/tenants/${tenantId}/plan`, { planId });
    },

    getSubscriptions: async (): Promise<SubscriptionAdminDto[]> => {
        const response = await api.get('/admin/subscriptions');
        return response.data;
    },

    updateSubscriptionPlan: async (tenantId: string, planId: string): Promise<void> => {
        await api.patch(`/admin/subscriptions/${tenantId}/plan`, { planId });
    },

    // Plans CRUD
    getPlans: async (): Promise<PlanDto[]> => {
        const response = await api.get('/admin/plans');
        return response.data;
    },

    createPlan: async (data: Partial<PlanDto>): Promise<PlanDto> => {
        const response = await api.post('/admin/plans', data);
        return response.data;
    },

    updatePlan: async (id: string, data: Partial<PlanDto>): Promise<PlanDto> => {
        const response = await api.patch(`/admin/plans/${id}`, data);
        return response.data;
    },

    deletePlan: async (id: string): Promise<void> => {
        await api.delete(`/admin/plans/${id}`);
    },

    getMrrChart: async (): Promise<{ month: string; mrr: number; tenants: number }[]> => {
        const response = await api.get('/admin/dashboard/mrr-chart');
        return response.data;
    },

    getTenantById: async (id: string): Promise<TenantAdminDto> => {
        const response = await api.get(`/admin/tenants/${id}`);
        return response.data;
    },
};

