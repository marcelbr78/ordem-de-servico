import { Controller, Get, Param, NotFoundException, Req } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { TenantsService } from '../tenants/tenants.service';
import { Request } from 'express';

@Controller('orders/public')
export class PublicOrdersController {
    constructor(
        private readonly ordersService: OrdersService,
        private readonly tenantsService: TenantsService
    ) { }

    @Get('monitor')
    findMonitor() {
        return this.ordersService.findAllActive();
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @Req() req: Request) {
        const tenantId = req['tenantId'] || 'default';
        let tenant = null;
        try {
            tenant = await this.tenantsService.findById(tenantId);
        } catch (e) {
            console.log(`[PublicOrdersController] Tenant ${tenantId} not found, using generic info`);
        }

        // We reuse the service but should be careful about what we return.
        // For now returning full object but in real app we should filter fields.
        // Assuming the ID is UUID or Protocol.

        // Check if ID is UUID
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

        try {
            const order = await this.ordersService.findOne(id);
            // TODO: Filter sensitive data
            return {
                id: order.id,
                protocol: order.protocol,
                status: order.status,
                updatedAt: order.updatedAt,
                equipments: order.equipments,
                total: order.finalValue,
                diagnosis: order.diagnosis,
                // Include shop info for WhatsApp redirection
                shopName: tenant?.name || 'Nossa Loja',
                shopPhone: tenant?.phone || '',
            };
        } catch (e) {
            // Try searching by protocol if implemented in service, or just fail
            throw new NotFoundException('Order not found');
        }
    }
}
