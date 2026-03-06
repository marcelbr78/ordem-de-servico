import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../guards/super-admin.guard';
import { ThrottlerGuard } from '@nestjs/throttler';

@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, SuperAdminGuard, ThrottlerGuard)
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get('stats')
    async getGlobalStats() {
        return this.dashboardService.getStats();
    }
}
