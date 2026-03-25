import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { CommissionsService } from './commissions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('commissions')
@UseGuards(JwtAuthGuard)
export class CommissionsController {
    constructor(private readonly svc: CommissionsService) {}

    // Lista com filtros
    @Get()
    findAll(@Query() q: any, @Request() req) {
        return this.svc.findAll({
            technicianId: q.technicianId,
            period: q.period,
            status: q.status,
            from: q.from,
            to: q.to,
            tenantId: req.user?.tenantId,
        });
    }

    // Summary por técnico
    @Get('summary')
    getSummary(@Query('period') period: string, @Request() req) {
        return this.svc.getSummaryByTechnician(period, req.user?.tenantId);
    }

    // Ranking de técnicos
    @Get('ranking')
    getRanking(@Query('period') period: string, @Request() req) {
        return this.svc.getRanking(period, req.user?.tenantId);
    }

    // Comissão de uma OS
    @Get('order/:orderId')
    findByOrder(@Param('orderId') orderId: string) {
        return this.svc.findByOrder(orderId);
    }

    // Calcular manualmente para uma OS
    @Post('calculate/:orderId')
    calculate(@Param('orderId') orderId: string, @Request() req) {
        return this.svc.calculateForOrder(orderId, req.user?.tenantId);
    }

    // Marcar IDs como pago
    @Post('pay')
    markPaid(@Body() body: { ids: string[] }) {
        return this.svc.markAsPaid(body.ids);
    }

    // Pagar todas de um técnico/período
    @Post('pay-period')
    payPeriod(@Body() body: { technicianId: string; period: string }) {
        return this.svc.payPeriod(body.technicianId, body.period);
    }

    // Ajuste manual
    @Patch(':id')
    update(@Param('id') id: string, @Body() body: any) {
        return this.svc.update(id, body);
    }
}
