import api from './api';

export interface SmartDiagnosticSuggestion {
    id: string;
    diagnosis: string;
    frequency: number;
    avg_price: number;
    avg_repair_time: number;
}

export interface SmartPricingSuggestion {
    diagnosis: string;
    avg_price: number;
    min_price: number;
    max_price: number;
    avg_repair_time: number;
    repair_count: number;
}

export interface SmartPartSuggestion {
    id: string;
    part_name: string;
    frequency: number;
}

// Simple in-memory cache for API calls to prevent repeated hits
const cache: Record<string, { timestamp: number; data: unknown }> = {};
const CACHE_DURATION = 30000; // 30 seconds

export const smartModulesService = {
    async getDiagnostics(model: string, symptom: string): Promise<SmartDiagnosticSuggestion[]> {
        const cacheKey = `diag_${model}_${symptom}`;
        if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_DURATION) {
            return cache[cacheKey].data as SmartDiagnosticSuggestion[];
        }

        const response = await api.get('/smart-diagnostics/suggestions', {
            params: { model, symptom },
        });

        // Take top 3 as requested
        const data = response.data?.slice(0, 3) || [];
        cache[cacheKey] = { timestamp: Date.now(), data };
        return data;
    },

    async getPricing(model: string, symptom: string): Promise<SmartPricingSuggestion | null> {
        const cacheKey = `price_${model}_${symptom}`;
        if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_DURATION) {
            return cache[cacheKey].data as SmartPricingSuggestion | null;
        }

        const response = await api.get('/smart-pricing/suggestion', {
            params: { model, symptom },
        });

        const data = response.data || null;
        cache[cacheKey] = { timestamp: Date.now(), data };
        return data;
    },

    async getParts(model: string, symptom: string, diagnosis: string): Promise<SmartPartSuggestion[]> {
        const cacheKey = `parts_${model}_${symptom}_${diagnosis}`;
        if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_DURATION) {
            return cache[cacheKey].data as SmartPartSuggestion[];
        }

        const response = await api.get('/smart-parts/suggestions', {
            params: { model, symptom, diagnosis },
        });

        const data = response.data?.slice(0, 5) || [];
        cache[cacheKey] = { timestamp: Date.now(), data };
        return data;
    },
};
