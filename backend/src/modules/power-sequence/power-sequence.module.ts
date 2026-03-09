import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiagnosticBoard } from './entities/diagnostic-board.entity';
import { PowerSequenceStep } from './entities/power-sequence-step.entity';
import { PowerSequenceAnalysis } from './entities/power-sequence-analysis.entity';
import { PowerSequenceService } from './power-sequence.service';
import { PowerSequenceController } from './power-sequence.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            DiagnosticBoard,
            PowerSequenceStep,
            PowerSequenceAnalysis
        ])
    ],
    controllers: [PowerSequenceController],
    providers: [PowerSequenceService],
    exports: [PowerSequenceService]
})
export class PowerSequenceModule { }
