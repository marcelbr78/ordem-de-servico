import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { SmartPartsService } from './smart-parts.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('smart-parts')
@UseGuards(JwtAuthGuard)
export class SmartPartsController {
    constructor(private readonly smartPartsService: SmartPartsService) { }

    @Get('suggestions')
    async getSuggestions(
        @Req() req: any,
        @Query('model') model: string,
        @Query('symptom') symptom: string,
        @Query('diagnosis') diagnosis: string,
    ) {
        const tenantId = req.user.tenantId;
        return this.smartPartsService.getSuggestions(tenantId, model, symptom, diagnosis);
    }
}
