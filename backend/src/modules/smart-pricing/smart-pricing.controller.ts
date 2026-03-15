import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { SmartPricingService } from './smart-pricing.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('smart-pricing')
@UseGuards(JwtAuthGuard)
export class SmartPricingController {
    constructor(private readonly smartPricingService: SmartPricingService) { }

    @Get('suggestion')
    async getSuggestion(
        @Req() req: any,
        @Query('model') model: string,
        @Query('symptom') symptom: string,
    ) {
        const tenantId = req.user.tenantId;
        return this.smartPricingService.getSuggestion(tenantId, model, symptom);
    }
}
