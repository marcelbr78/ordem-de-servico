import { Controller, Get, Post, Patch, Delete, Body, Param, Res, UseGuards, Req } from '@nestjs/common';
import { Response } from 'express';
import { QuotesService } from './quotes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('quotes')
@UseGuards(JwtAuthGuard)
export class QuotesController {
    constructor(private readonly svc: QuotesService) {}

    // Criar/atualizar orçamento de uma OS
    @Post('order/:orderId')
    upsert(@Param('orderId') orderId: string, @Body() dto: any, @Req() req: any) {
        return this.svc.upsert(orderId, dto, req.user?.tenantId);
    }

    // Buscar orçamentos de uma OS
    @Get('order/:orderId')
    findByOrder(@Param('orderId') orderId: string) {
        return this.svc.findByOrder(orderId);
    }

    // Auto-preencher itens a partir das peças da OS
    @Get('order/:orderId/auto-fill')
    autoFill(@Param('orderId') orderId: string) {
        return this.svc.autoFillFromOrder(orderId);
    }

    // Buscar orçamento por ID
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.svc.findOne(id);
    }

    // Gerar PDF
    @Get(':id/pdf')
    async pdf(@Param('id') id: string, @Res() res: Response) {
        const { buffer, filename } = await this.svc.generatePdf(id);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': buffer.length,
        });
        res.end(buffer);
    }

    // Marcar como enviado
    @Patch(':id/send')
    send(@Param('id') id: string, @Req() req: any) {
        return this.svc.send(id, req.user?.id);
    }

    // Aprovar
    @Patch(':id/approve')
    approve(@Param('id') id: string, @Body() body: { clientName?: string }) {
        return this.svc.approve(id, body.clientName);
    }

    // Rejeitar
    @Patch(':id/reject')
    reject(@Param('id') id: string, @Body() body: { reason?: string }) {
        return this.svc.reject(id, body.reason);
    }

    // Cancelar
    @Patch(':id/cancel')
    cancel(@Param('id') id: string) {
        return this.svc.cancel(id);
    }
}
