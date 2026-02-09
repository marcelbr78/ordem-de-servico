import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('finance')
@UseGuards(JwtAuthGuard)
export class FinanceController {
    constructor(private readonly financeService: FinanceService) { }

    @Post()
    create(@Body() createDto: CreateTransactionDto) {
        return this.financeService.create(createDto);
    }

    @Get()
    findAll() {
        return this.financeService.findAll();
    }

    @Get('summary')
    getSummary() {
        return this.financeService.getSummary();
    }

    @Get('order/:orderId')
    findByOrder(@Param('orderId') orderId: string) {
        return this.financeService.findByOrder(orderId);
    }
}
