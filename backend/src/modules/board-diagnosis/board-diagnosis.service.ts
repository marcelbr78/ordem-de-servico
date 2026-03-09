import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Board } from './entities/board.entity';
import { SymptomCategory } from './entities/symptom-category.entity';
import { DiagnosticSession } from './entities/diagnostic-session.entity';
import { DiagnosticStep } from './entities/diagnostic-step.entity';
import { RepairCase } from './entities/repair-case.entity';

import { CreateBoardDto } from './dto/create-board.dto';
import { StartSessionDto } from './dto/start-session.dto';
import { SubmitMeasurementDto } from './dto/submit-measurement.dto';
import { CreateRepairCaseDto } from './dto/create-repair-case.dto';

import { GuidedDiagnosisEngine } from './engines/guided-diagnosis.engine';
import { RepairGraphService } from './knowledge/repair-graph.service';

@Injectable()
export class BoardDiagnosisService {
    constructor(
        @InjectRepository(Board)
        private boardRepo: Repository<Board>,
        @InjectRepository(SymptomCategory)
        private symptomCategoryRepo: Repository<SymptomCategory>,
        @InjectRepository(DiagnosticSession)
        private sessionRepo: Repository<DiagnosticSession>,
        @InjectRepository(DiagnosticStep)
        private stepRepo: Repository<DiagnosticStep>,
        @InjectRepository(RepairCase)
        private repairCaseRepo: Repository<RepairCase>,

        private guidedDiagnosisEngine: GuidedDiagnosisEngine,
        private repairGraphService: RepairGraphService,
    ) { }

    async createBoard(createBoardDto: CreateBoardDto): Promise<Board> {
        const board = this.boardRepo.create(createBoardDto);
        return await this.boardRepo.save(board);
    }

    async findAllBoards(): Promise<Board[]> {
        return await this.boardRepo.find();
    }

    async getSymptomCategories(): Promise<SymptomCategory[]> {
        return await this.symptomCategoryRepo.find();
    }

    async startSession(dto: StartSessionDto): Promise<DiagnosticSession> {
        const session = this.sessionRepo.create({
            board_id: dto.board_id,
            symptom_category_id: dto.symptom_category_id,
            symptom_description: dto.symptom_description,
            charger_current: dto.charger_current,
            bench_current: dto.bench_current,
            power_button_current: dto.power_button_current,
            status: 'active'
        });
        return await this.sessionRepo.save(session);
    }

    async getNextStep(sessionId: string): Promise<any> {
        const session = await this.sessionRepo.findOne({
            where: { id: sessionId },
            relations: ['symptomCategory']
        });
        if (!session) throw new NotFoundException('Session not found');

        const lastStep = await this.stepRepo.findOne({
            where: { session_id: sessionId },
            order: { step_number: 'DESC' }
        });

        const nextStepData = this.guidedDiagnosisEngine.determineNextStep(
            session,
            lastStep || null,
            session.symptomCategory
        );

        if (!nextStepData) {
            // End of flow, return results based on the last step
            if (lastStep && lastStep.result === 'fail') {
                return {
                    finished: true,
                    diagnosis: lastStep.next_step_if_fail || 'Failure detected at step ' + lastStep.step_number,
                    possible_components: [lastStep.next_step_if_fail]
                };
            }

            if (lastStep && lastStep.result === 'pass' && lastStep.next_step_if_ok === 'Return diagnostic summary.') {
                return {
                    finished: true,
                    diagnosis: 'All standard power rails passed. The issue may lie elsewhere (e.g. CPU/RAM).',
                    possible_components: []
                };
            }

            const probabilities = await this.repairGraphService.calculateProbabilities(
                session.symptom_category_id,
                {}
            );
            return {
                finished: true,
                diagnosis: 'Diagnosis complete',
                probabilities
            };
        }

        const newStep = this.stepRepo.create({
            session_id: sessionId,
            ...nextStepData
        });

        return await this.stepRepo.save(newStep);
    }

    async submitMeasurement(dto: SubmitMeasurementDto): Promise<DiagnosticStep> {
        const step = await this.stepRepo.findOne({ where: { id: dto.step_id } });
        if (!step) throw new NotFoundException('Step not found');

        step.measurement = dto.measurement;
        // Simple logic for pass/fail mockup
        if (!dto.result) {
            step.result = dto.measurement.includes('0V') ? 'fail' : 'pass';
        } else {
            step.result = dto.result;
        }

        return await this.stepRepo.save(step);
    }

    async createRepairCase(dto: CreateRepairCaseDto): Promise<RepairCase> {
        const result = this.repairCaseRepo.create(dto);
        return await this.repairCaseRepo.save(result);
    }
}
