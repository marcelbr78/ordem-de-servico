import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiagnosticPattern } from './entities/diagnostic-pattern.entity';

@Injectable()
export class SmartDiagnosticsService {
    constructor(
        @InjectRepository(DiagnosticPattern)
        private diagnosticRepository: Repository<DiagnosticPattern>,
    ) { }

    async getSuggestions(tenantId: string, model: string, symptom: string) {
        if (!model || !symptom) return [];

        return this.diagnosticRepository.find({
            where: { tenantId, model, symptom },
            order: { frequency: 'DESC' },
            take: 5,
        });
    }
}
