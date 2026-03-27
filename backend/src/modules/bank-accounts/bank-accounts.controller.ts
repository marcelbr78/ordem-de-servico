import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { BankAccountsService } from './bank-accounts.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('bank-accounts')
@UseGuards(JwtAuthGuard)
export class BankAccountsController {
    constructor(private readonly bankAccountsService: BankAccountsService) {}

    @Post()
    create(@Body() dto: Record<string, unknown>, @Request() req) {
        return this.bankAccountsService.createFromRaw(dto, req.user?.tenantId);
    }

    @Get()
    findAll(@Request() req) {
        return this.bankAccountsService.findAll(req.user?.tenantId);
    }

    @Get('summary')
    getSummary(@Request() req) {
        return this.bankAccountsService.getTotalBalance(req.user?.tenantId);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Request() req) {
        const tenantId = req.user.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant não identificado');
        return this.bankAccountsService.findOne(id, tenantId);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: Record<string, unknown>, @Request() req) {
        const tenantId = req.user.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant não identificado');
        return this.bankAccountsService.updateFromRaw(id, dto, tenantId);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Request() req) {
        const tenantId = req.user.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant não identificado');
        return this.bankAccountsService.remove(id, tenantId);
    }
}
