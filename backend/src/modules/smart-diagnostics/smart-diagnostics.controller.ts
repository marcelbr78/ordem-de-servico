import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { SmartDiagnosticsService } from './smart-diagnostics.service';
import { ExternalSearchService } from './external-search.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('smart-diagnostics')
@UseGuards(JwtAuthGuard)
export class SmartDiagnosticsController {
    constructor(
        private readonly smartDiagnosticsService: SmartDiagnosticsService,
        private readonly externalSearchService: ExternalSearchService,
    ) {}

    @Get('suggestions')
    async getSuggestions(@Req() req: any, @Query('model') model: string, @Query('symptom') symptom: string) {
        const tenantId = req.user.tenantId;
        return this.smartDiagnosticsService.getSuggestions(tenantId, model, symptom);
    }

    @Get('external-search')
    async externalSearch(@Query('model') model: string, @Query('symptom') symptom: string) {
        if (!model || !symptom) return [];
        return this.externalSearchService.search(model, symptom);
    }

    @Get('estimate')
    async getEstimate(
        @Query('model') model: string,
        @Query('symptom') symptom: string,
        @Query('diagnosis') diagnosis: string,
    ) {
        if (!model || !symptom) return null;
        return this.externalSearchService.getRepairEstimate(model, symptom, diagnosis || symptom);
    }
}
