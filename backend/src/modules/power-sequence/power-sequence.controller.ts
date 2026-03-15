import { Controller, Get, Param, Post, Body, ParseIntPipe } from '@nestjs/common';
import { PowerSequenceService } from './power-sequence.service';

@Controller('power-sequence')
export class PowerSequenceController {
    constructor(private readonly service: PowerSequenceService) { }

    @Get('boards')
    async getBoards() {
        return this.service.getBoards();
    }

    @Get('boards/:id/sequence')
    async getBoardSequence(@Param('id', ParseIntPipe) id: number) {
        return this.service.getBoardSequence(id);
    }

    @Post('analyze')
    async analyze(@Body() body: { boardId: number, railsDetected: string[] }) {
        return this.service.analyze(body.boardId, body.railsDetected);
    }
}
