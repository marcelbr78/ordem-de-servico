import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
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
    findOne(@Param('id') id: string) {
        return this.bankAccountsService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: Record<string, unknown>) {
        return this.bankAccountsService.updateFromRaw(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.bankAccountsService.remove(id);
    }
}
