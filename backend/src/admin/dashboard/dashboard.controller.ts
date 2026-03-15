import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { HealthService } from './health.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../guards/super-admin.guard';
import { ThrottlerGuard } from '@nestjs/throttler';

@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, SuperAdminGuard, ThrottlerGuard)
export class DashboardController {
    constructor(
        private readonly dashboardService: DashboardService,
        private readonly healthService: HealthService,
    ) {}

    @Get('stats')
    async getGlobalStats() {
        return this.dashboardService.getStats();
    }

    @Get('mrr-chart')
    async getMrrChart() {
        return this.dashboardService.getMrrChart();
    }

    @Get('health')
    async getHealth() {
        return this.healthService.getFullReport();
    }

    @Get('onboarding')
    async getOnboarding() {
        return this.healthService.getOnboardingScores();
    }

    @Get('analytics')
    async getAnalytics() {
        return this.healthService.getAdvancedAnalytics();
    }

    @Get('audit')
    async getAuditLogs(
        @Query('page') page = '1',
        @Query('search') search?: string,
    ) {
        return this.healthService.getAuditLogs(parseInt(page), search);
    }
}
