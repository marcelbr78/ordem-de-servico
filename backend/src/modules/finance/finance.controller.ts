import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('finance')
@UseGuards(JwtAuthGuard)
export class FinanceController {
    constructor(private readonly financeService: FinanceService) {}

    @Post()
    create(@Body() dto: CreateTransactionDto) {
        return this.financeService.create(dto);
    }

    @Get()
    findAll(@Query() q: any) {
        return this.financeService.findAll({
            from: q.from, to: q.to, type: q.type,
            status: q.status, category: q.category, search: q.search,
        });
    }

    @Get('summary')
    getSummary(@Query('from') from?: string, @Query('to') to?: string) {
        return this.financeService.getSummary(from, to);
    }

    @Get('dre')
    getDre(@Query('year') year?: string) {
        return this.financeService.getDre(Number(year) || new Date().getFullYear());
    }

    @Get('upcoming')
    getUpcoming(@Query('days') days?: string) {
        return this.financeService.getUpcoming(Number(days) || 30);
    }

    @Get('cashflow')
    getCashFlow(@Query('days') days?: string) {
        return this.financeService.getCashFlow(Number(days) || 30);
    }

    @Get('by-category')
    getByCategory(@Query('from') from?: string, @Query('to') to?: string) {
        return this.financeService.getByCategory(from, to);
    }

    @Get('order/:orderId')
    findByOrder(@Param('orderId') orderId: string) {
        return this.financeService.findByOrder(orderId);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: Partial<CreateTransactionDto>) {
        return this.financeService.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.financeService.remove(id);
    }
}
