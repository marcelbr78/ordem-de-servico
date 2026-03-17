import { Controller, Get, Post, Patch, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderServiceItem } from './entities/order-service-item.entity';
import { OrderHistory, HistoryActionType } from './entities/order-history.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('orders/:orderId/service-items')
@UseGuards(JwtAuthGuard)
export class OrderServiceItemsController {
    constructor(
        @InjectRepository(OrderServiceItem)
        private itemsRepo: Repository<OrderServiceItem>,
        @InjectRepository(OrderHistory)
        private historyRepo: Repository<OrderHistory>,
    ) {}

    @Get()
    findAll(@Param('orderId') orderId: string) {
        return this.itemsRepo.find({ where: { orderId }, order: { createdAt: 'ASC' } });
    }

    @Post()
    async create(
        @Param('orderId') orderId: string,
        @Body() body: { name: string; description?: string; price: number; catalogId?: string },
        @Request() req,
    ) {
        const tenantId = req.user?.tenantId;
        const item = this.itemsRepo.create({ ...body, orderId, tenantId });
        const saved = await this.itemsRepo.save(item);

        await this.historyRepo.save(this.historyRepo.create({
            orderId,
            tenantId,
            actionType: HistoryActionType.ITEM_EDIT,
            userId: req.user?.sub,
            comments: `Serviço adicionado: "${body.name}" — R$ ${Number(body.price).toFixed(2).replace('.', ',')}`,
        }));

        return saved;
    }

    @Patch(':itemId')
    async update(
        @Param('orderId') orderId: string,
        @Param('itemId') itemId: string,
        @Body() body: { name?: string; description?: string; price?: number },
        @Request() req,
    ) {
        const existing = await this.itemsRepo.findOne({ where: { id: itemId, orderId } });
        if (!existing) return { error: 'Item não encontrado' };

        const changes: string[] = [];

        if (body.name !== undefined && body.name !== existing.name) {
            changes.push(`Nome: "${existing.name}" → "${body.name}"`);
        }
        if (body.description !== undefined && body.description !== existing.description) {
            changes.push(`Descrição: "${existing.description || ''}" → "${body.description}"`);
        }
        if (body.price !== undefined && Number(body.price) !== Number(existing.price)) {
            changes.push(`Valor: R$ ${Number(existing.price).toFixed(2).replace('.', ',')} → R$ ${Number(body.price).toFixed(2).replace('.', ',')}`);
        }

        Object.assign(existing, body);
        const saved = await this.itemsRepo.save(existing);

        if (changes.length > 0) {
            await this.historyRepo.save(this.historyRepo.create({
                orderId,
                tenantId: req.user?.tenantId,
                actionType: HistoryActionType.ITEM_EDIT,
                userId: req.user?.sub,
                comments: `Serviço editado: "${saved.name}"\n${changes.join('\n')}`,
            }));
        }

        return saved;
    }

    @Delete(':itemId')
    async remove(
        @Param('orderId') orderId: string,
        @Param('itemId') itemId: string,
        @Request() req,
    ) {
        const existing = await this.itemsRepo.findOne({ where: { id: itemId, orderId } });
        if (!existing) return { error: 'Item não encontrado' };

        await this.itemsRepo.delete(itemId);

        await this.historyRepo.save(this.historyRepo.create({
            orderId,
            tenantId: req.user?.tenantId,
            actionType: HistoryActionType.ITEM_EDIT,
            userId: req.user?.sub,
            comments: `Serviço removido: "${existing.name}" — R$ ${Number(existing.price).toFixed(2).replace('.', ',')}`,
        }));

        return { success: true };
    }
}
