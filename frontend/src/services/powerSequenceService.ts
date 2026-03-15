import api from './api';

export interface DiagnosticBoard {
    id: number;
    model: string;
    manufacturer: string;
    description?: string;
}

export interface PowerSequenceStep {
    id: number;
    stepOrder: number;
    railName: string;
    expectedVoltage?: string;
    required: boolean;
    groupName?: string;
}

export interface PowerSequenceAnalysis {
    id: number;
    railsDetected: string[];
    result: string;
    createdAt: string;
}

export const powerSequenceService = {
    async getBoards(): Promise<DiagnosticBoard[]> {
        const response = await api.get('/power-sequence/boards');
        return response.data;
    },

    async getBoardSequence(boardId: number): Promise<{ id: number, steps: PowerSequenceStep[] }> {
        const response = await api.get(`/power-sequence/boards/${boardId}/sequence`);
        return response.data;
    },

    async analyze(boardId: number, railsDetected: string[]): Promise<{
        analysisId: number;
        result: string;
        failingRail: string | null;
        lastValidRail: string | null;
    }> {
        const response = await api.post('/power-sequence/analyze', {
            boardId,
            railsDetected
        });
        return response.data;
    }
};
