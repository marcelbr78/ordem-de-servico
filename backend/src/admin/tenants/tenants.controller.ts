import { Controller, Get, Patch, Param, Body, UseGuards, Query } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../guards/super-admin.guard';

@Controller('admin/tenants')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class TenantsController {
    constructor(private readonly tenantsService: TenantsService) { }

    @Get()
    async findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string
    ) {
        const p = page ? parseInt(page, 10) : 1;
        const l = limit ? parseInt(limit, 10) : 20;
        return this.tenantsService.findAll(p, l);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.tenantsService.findOne(id);
    }

    @Patch(':id/status')
    async updateStatus(
        @Param('id') id: string,
        @Body() body: { status: any }
    ) {
        return this.tenantsService.updateStatus(id, body.status);
    }

    @Patch(':id/plan')
    async changePlan(
        @Param('id') id: string,
        @Body() body: { planId: string }
    ) {
        return this.tenantsService.changePlan(id, body.planId);
    }
}
