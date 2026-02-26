import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';

@Controller('orders/public')
export class PublicOrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Get('monitor')
    findMonitor() {
        return this.ordersService.findAllActive();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
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
                // Do NOT return client details publicly
            };
        } catch (e) {
            // Try searching by protocol if implemented in service, or just fail
            throw new NotFoundException('Order not found');
        }
    }
}
