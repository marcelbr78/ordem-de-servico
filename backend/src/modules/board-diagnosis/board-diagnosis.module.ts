import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BoardDiagnosisController } from './board-diagnosis.controller';
import { BoardDiagnosisService } from './board-diagnosis.service';

import { Board } from './entities/board.entity';
import { SymptomCategory } from './entities/symptom-category.entity';
import { Circuit } from './entities/circuit.entity';
import { PowerRail } from './entities/power-rail.entity';
import { DiagnosticSession } from './entities/diagnostic-session.entity';
import { DiagnosticStep } from './entities/diagnostic-step.entity';
import { RepairCase } from './entities/repair-case.entity';

import { GuidedDiagnosisEngine } from './engines/guided-diagnosis.engine';
import { CircuitAnalysisService } from './services/circuit-analysis.service';
import { RepairGraphService } from './knowledge/repair-graph.service';
import { SchematicParserService } from './parsers/schematic-parser.service';
import { BoardviewParserService } from './parsers/boardview-parser.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Board,
            SymptomCategory,
            Circuit,
            PowerRail,
            DiagnosticSession,
            DiagnosticStep,
            RepairCase
        ])
    ],
    controllers: [BoardDiagnosisController],
    providers: [
        BoardDiagnosisService,
        GuidedDiagnosisEngine,
        CircuitAnalysisService,
        RepairGraphService,
        SchematicParserService,
        BoardviewParserService
    ],
    exports: [BoardDiagnosisService]
})
export class BoardDiagnosisModule { }
