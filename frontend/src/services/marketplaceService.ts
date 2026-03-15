import api from './api';

export interface MarketplaceModule {
    id: string;
    name: string;
    description: string;
    price: number;
    active: boolean;
    isCore: boolean;
    isInstalled: boolean;
}

export const marketplaceService = {
    async getAvailableModules(): Promise<MarketplaceModule[]> {
        const response = await api.get('/saas-modules/marketplace/available');
        return response.data;
    },

    async installModule(moduleId: string): Promise<void> {
        await api.post(`/saas-modules/marketplace/install/${moduleId}`);
    },

    async uninstallModule(moduleId: string): Promise<void> {
        await api.post(`/saas-modules/marketplace/uninstall/${moduleId}`);
    }
};
