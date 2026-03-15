import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Appointment } from './entities/appointment.entity';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class SchedulerController {
    constructor(@InjectRepository(Appointment) private repo: Repository<Appointment>) {}

    @Get()
    findAll(@Req() req: any, @Query('from') from?: string, @Query('to') to?: string) {
        const where: any = {};
        if (req.user?.tenantId) where.tenantId = req.user.tenantId;
        if (from && to) where.startAt = Between(new Date(from), new Date(to));
        return this.repo.find({ where, order: { startAt: 'ASC' } });
    }

    @Post()
    create(@Body() body: Partial<Appointment>, @Req() req: any) {
        const a = this.repo.create({ ...body, tenantId: req.user?.tenantId });
        return this.repo.save(a);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() body: Partial<Appointment>) {
        await this.repo.update(id, body); return this.repo.findOne({ where: { id } });
    }

    @Delete(':id')
    async remove(@Param('id') id: string) { await this.repo.delete(id); return { success: true }; }
}
