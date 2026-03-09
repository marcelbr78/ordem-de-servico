import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { BoardDiagnosisService } from './board-diagnosis.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { StartSessionDto } from './dto/start-session.dto';
import { SubmitMeasurementDto } from './dto/submit-measurement.dto';
import { CreateRepairCaseDto } from './dto/create-repair-case.dto';

@Controller('board-diagnosis')
export class BoardDiagnosisController {
    constructor(private readonly boardDiagnosisService: BoardDiagnosisService) { }

    @Post('boards')
    createBoard(@Body() createBoardDto: CreateBoardDto) {
        return this.boardDiagnosisService.createBoard(createBoardDto);
    }

    @Get('boards')
    findAllBoards() {
        return this.boardDiagnosisService.findAllBoards();
    }

    @Get('symptoms')
    getSymptomCategories() {
        return this.boardDiagnosisService.getSymptomCategories();
    }

    @Post('session')
    startSession(@Body() dto: StartSessionDto) {
        return this.boardDiagnosisService.startSession(dto);
    }

    @Get('session/:id/next-step')
    getNextStep(@Param('id') sessionId: string) {
        return this.boardDiagnosisService.getNextStep(sessionId);
    }

    @Post('session/:id/measurement')
    submitMeasurement(
        @Param('id') sessionId: string,
        @Body() dto: SubmitMeasurementDto
    ) {
        return this.boardDiagnosisService.submitMeasurement(dto);
    }

    @Post('repair-case')
    createRepairCase(@Body() dto: CreateRepairCaseDto) {
        return this.boardDiagnosisService.createRepairCase(dto);
    }
}
