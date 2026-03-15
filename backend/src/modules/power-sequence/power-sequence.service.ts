import { Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiagnosticBoard } from './entities/diagnostic-board.entity';
import { PowerSequenceStep } from './entities/power-sequence-step.entity';
import { PowerSequenceAnalysis } from './entities/power-sequence-analysis.entity';

@Injectable()
export class PowerSequenceService implements OnModuleInit {
    constructor(
        @InjectRepository(DiagnosticBoard)
        private boardRepo: Repository<DiagnosticBoard>,
        @InjectRepository(PowerSequenceStep)
        private stepRepo: Repository<PowerSequenceStep>,
        @InjectRepository(PowerSequenceAnalysis)
        private analysisRepo: Repository<PowerSequenceAnalysis>,
    ) { }

    async onModuleInit() {
        try {
            await this.seed();
        } catch (e) {
            console.warn('⚠️ PowerSequence seed ignorado (banco ainda não pronto):', e.message);
        }
    }

    async seed() {
        const existingBoard = await this.boardRepo.findOne({ where: { model: '820-02100' } });
        if (!existingBoard) {
            const board = this.boardRepo.create({
                model: '820-02100',
                manufacturer: 'Apple',
                description: 'MacBook Air M1 Logic Board'
            });
            await this.boardRepo.save(board);

            const rails = [
                { order: 1, name: 'PPBUS_AON' },
                { order: 2, name: 'PP3V8_AON' },
                { order: 3, name: 'PP1V8_AON' },
                { order: 4, name: 'PP1V225_AWAKE' },
                { order: 5, name: 'PP1V8_S2' },
                { order: 6, name: 'PP3V3_S2' },
                { order: 7, name: 'PP2V5_NAND' },
                { order: 8, name: 'PP1V2_NAND' },
                { order: 9, name: 'PP0V9_NAND' },
                { order: 10, name: 'PP0V575_S1_VDDQ' },
                { order: 11, name: 'PPVDD_CPU' },
                { order: 12, name: 'PPVDD_GPU' }
            ];

            for (const r of rails) {
                const step = this.stepRepo.create({
                    board,
                    stepOrder: r.order,
                    railName: r.name,
                    required: true
                });
                await this.stepRepo.save(step);
            }
            console.log('[PowerSequence] Seeded board 820-02100 and initial rails.');
        }
    }

    async getBoards() {
        return this.boardRepo.find({ order: { model: 'ASC' } });
    }

    async getBoardSequence(boardId: number) {
        const board = await this.boardRepo.findOne({
            where: { id: boardId },
            relations: ['steps']
        });

        if (!board) throw new NotFoundException('Board not found');

        // sort by step order
        board.steps.sort((a, b) => a.stepOrder - b.stepOrder);
        return board;
    }

    async analyze(boardId: number, railsDetected: string[]) {
        const board = await this.boardRepo.findOne({
            where: { id: boardId },
            relations: ['steps']
        });

        if (!board) throw new NotFoundException('Board not found');

        const sortedSteps = board.steps.sort((a, b) => a.stepOrder - b.stepOrder);

        let lastValidStep = null;
        let failingStep = null;

        for (const step of sortedSteps) {
            if (railsDetected.includes(step.railName)) {
                lastValidStep = step;
            } else {
                failingStep = step;
                break;
            }
        }

        let resultMessage = '';
        if (failingStep) {
            resultMessage = `A sequência parou no rail: ${failingStep.railName} (Passo ${failingStep.stepOrder}). Verifique o circuito responsável por gerar esta tensão.`;
        } else {
            resultMessage = 'Todos os rails selecionados da sequência estão presentes. A placa parece estar completando o power sequence básico.';
        }

        const analysis = this.analysisRepo.create({
            board,
            railsDetected,
            result: resultMessage
        });

        await this.analysisRepo.save(analysis);

        return {
            analysisId: analysis.id,
            result: resultMessage,
            failingRail: failingStep ? failingStep.railName : null,
            lastValidRail: lastValidStep ? lastValidStep.railName : null
        };
    }
}
