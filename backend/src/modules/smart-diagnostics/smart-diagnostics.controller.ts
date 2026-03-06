import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { SmartDiagnosticsService } from './smart-diagnostics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('smart-diagnostics')
@UseGuards(JwtAuthGuard)
export class SmartDiagnosticsController {
    constructor(private readonly smartDiagnosticsService: SmartDiagnosticsService) { }

    @Get('suggestions')
    async getSuggestions(
        @Req() req: any,
        @Query('model') model: string,
        @Query('symptom') symptom: string,
    ) {
        const tenantId = req.user.tenantId;
        return this.smartDiagnosticsService.getSuggestions(tenantId, model, symptom);
    }
}
