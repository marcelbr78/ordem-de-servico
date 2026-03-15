import api from './api';

export interface Board {
    id: string;
    name: string;
    model: string;
    manufacturer: string;
}

export interface SymptomCategory {
    id: string;
    name: string;
    description: string;
}

export interface DiagnosticSession {
    id: string;
    status: string;
}

export const boardDiagnosisApi = {
    getBoards: async () => {
        const response = await api.get('/board-diagnosis/boards');
        return response.data;
    },

    getSymptoms: async () => {
        const response = await api.get('/board-diagnosis/symptoms');
        return response.data;
    },

    startSession: async (data: Record<string, unknown>) => {
        const response = await api.post('/board-diagnosis/session', data);
        return response.data;
    },

    getNextStep: async (sessionId: string) => {
        const response = await api.get(`/board-diagnosis/session/${sessionId}/next-step`);
        return response.data;
    },

    submitMeasurement: async (sessionId: string, data: Record<string, unknown>) => {
        const response = await api.post(`/board-diagnosis/session/${sessionId}/measurement`, data);
        return response.data;
    },

    createRepairCase: async (data: Record<string, unknown>) => {
        const response = await api.post('/board-diagnosis/repair-case', data);
        return response.data;
    }
};
