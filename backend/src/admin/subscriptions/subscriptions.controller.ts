import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../guards/super-admin.guard';

@Controller('admin/subscriptions')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class SubscriptionsController {
    constructor(private readonly subscriptionsService: SubscriptionsService) { }

    @Get()
    async findAll() {
        return this.subscriptionsService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.subscriptionsService.findOne(id);
    }

    @Patch(':id/plan')
    async updatePlan(
        @Param('id') id: string,
        @Body() body: { planId: string }
    ) {
        return this.subscriptionsService.updatePlan(id, body.planId);
    }
}
