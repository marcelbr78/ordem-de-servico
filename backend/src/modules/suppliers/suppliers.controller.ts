import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Supplier } from './entities/supplier.entity';

@Controller('suppliers')
@UseGuards(JwtAuthGuard)
export class SuppliersController {
    constructor(@InjectRepository(Supplier) private repo: Repository<Supplier>) {}

    @Get()
    findAll(@Req() req: any, @Query('q') q?: string) {
        const where: any = { tenantId: req.user?.tenantId };
        if (q) where.name = Like(`%${q}%`);
        return this.repo.find({ where, order: { name: 'ASC' } });
    }

    @Get(':id')
    findOne(@Param('id') id: string) { return this.repo.findOne({ where: { id } }); }

    @Post()
    create(@Body() body: Partial<Supplier>, @Req() req: any) {
        const s = this.repo.create({ ...body, tenantId: req.user?.tenantId });
        return this.repo.save(s);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() body: Partial<Supplier>) {
        await this.repo.update(id, body); return this.repo.findOne({ where: { id } });
    }

    @Delete(':id')
    async remove(@Param('id') id: string) { await this.repo.delete(id); return { success: true }; }
}
