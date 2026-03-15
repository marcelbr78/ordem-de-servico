import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { BankAccountsService } from './bank-accounts.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('bank-accounts')
@UseGuards(JwtAuthGuard)
export class BankAccountsController {
    constructor(private readonly bankAccountsService: BankAccountsService) { }

    @Post()
    @UsePipes(new ValidationPipe({ whitelist: false, forbidNonWhitelisted: false, transform: false }))
    create(@Body() dto: Record<string, unknown>) {
        console.log('[BankAccounts] POST body:', JSON.stringify(dto));
        return this.bankAccountsService.createFromRaw(dto);
    }

    @Get()
    findAll() {
        return this.bankAccountsService.findAll();
    }

    @Get('summary')
    getTotalBalance() {
        return this.bankAccountsService.getTotalBalance();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.bankAccountsService.findOne(id);
    }

    @Patch(':id')
    @UsePipes(new ValidationPipe({ whitelist: false, forbidNonWhitelisted: false, transform: false }))
    update(@Param('id') id: string, @Body() dto: Record<string, unknown>) {
        return this.bankAccountsService.updateFromRaw(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.bankAccountsService.remove(id);
    }
}
