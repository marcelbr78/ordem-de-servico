import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { PlansService } from './plans.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../guards/super-admin.guard';

@Controller('admin/plans')
export class PlansController {
    constructor(private readonly plansService: PlansService) { }

    @Get()
    async findAll() {
        return this.plansService.findAll();
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, SuperAdminGuard)
    async findOne(@Param('id') id: string) {
        return this.plansService.findOne(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard, SuperAdminGuard)
    async create(@Body() body: any) {
        return this.plansService.create(body);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, SuperAdminGuard)
    async update(@Param('id') id: string, @Body() body: any) {
        return this.plansService.update(id, body);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(JwtAuthGuard, SuperAdminGuard)
    async remove(@Param('id') id: string) {
        return this.plansService.remove(id);
    }
}
