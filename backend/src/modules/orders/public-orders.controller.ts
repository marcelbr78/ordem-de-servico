import { Controller, Get, Post, Param, Body, NotFoundException, Req } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { TenantsService } from '../tenants/tenants.service';
import { Request } from 'express';
import { OSStatus } from './entities/order-service.entity';

@Controller('orders/public')
export class PublicOrdersController {
    constructor(
        private readonly ordersService: OrdersService,
        private readonly tenantsService: TenantsService,
    ) {}

    @Get('monitor')
    findMonitor() {
        return this.ordersService.findAllActive();
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @Req() req: Request) {
        const tenantId = req['tenantId'] || 'default';
        let tenant = null;
        try { tenant = await this.tenantsService.findById(tenantId); } catch {}

        try {
            const order = await this.ordersService.findOne(id);
            return {
                id: order.id,
                protocol: order.protocol,
                status: order.status,
                priority: order.priority,
                updatedAt: order.updatedAt,
                entryDate: order.entryDate,
                exitDate: order.exitDate,
                equipments: order.equipments,
                diagnosis: order.diagnosis,
                technicalReport: order.technicalReport,
                estimatedValue: order.estimatedValue,
                finalValue: order.finalValue,
                history: (order as any).history?.slice(-5) || [],
                shopName: tenant?.name || 'Nossa Loja',
                shopPhone: tenant?.phone || '',
                // Mostrar orçamento somente se aguardando aprovação
                showBudget: order.status === OSStatus.AGUARDANDO_APROVACAO,
            };
        } catch {
            throw new NotFoundException('Ordem de Serviço não encontrada.');
        }
    }

    // ── Aprovação / Rejeição de orçamento ──────────────────────────
    @Post(':id/approve')
    async approveOrder(
        @Param('id') id: string,
        @Body() body: { approved: boolean; clientNote?: string },
    ) {
        const order = await this.ordersService.findOne(id);
        if (!order) throw new NotFoundException('OS não encontrada.');

        if (order.status !== OSStatus.AGUARDANDO_APROVACAO) {
            return { success: false, message: 'Esta OS não está aguardando aprovação.' };
        }

        const newStatus = body.approved ? OSStatus.AGUARDANDO_PECA : OSStatus.CANCELADA;
        const comment = body.approved
            ? `✅ Orçamento aprovado pelo cliente via link público.${body.clientNote ? ' Observação: ' + body.clientNote : ''}`
            : `❌ Orçamento rejeitado pelo cliente via link público.${body.clientNote ? ' Motivo: ' + body.clientNote : ''}`;

        await this.ordersService.changeStatus(
            id,
            { status: newStatus, comments: comment },
            undefined,
            (order as any).tenantId,
        );

        return {
            success: true,
            approved: body.approved,
            newStatus,
            message: body.approved
                ? 'Orçamento aprovado! Em breve iniciaremos o reparo.'
                : 'Entendemos. A OS foi cancelada. Você pode retirar seu equipamento.',
        };
    }
}
