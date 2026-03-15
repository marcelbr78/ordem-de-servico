import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppEvent, WorkOrderStatusChangedPayload } from '../events/event-types';
import { OrderService, OSStatus } from '../orders/entities/order-service.entity';
import { RepairPricePattern } from './entities/repair-price-pattern.entity';

@Injectable()
export class SmartPricingListener {
    constructor(
        @InjectRepository(OrderService)
        private ordersRepository: Repository<OrderService>,
        @InjectRepository(RepairPricePattern)
        private pricingRepository: Repository<RepairPricePattern>,
    ) { }

    @OnEvent(AppEvent.WORK_ORDER_STATUS_CHANGED)
    async handleOrderCompleted(payload: WorkOrderStatusChangedPayload) {
        if (payload.newStatus !== OSStatus.FINALIZADA && payload.newStatus !== OSStatus.ENTREGUE) {
            return;
        }

        const order = await this.ordersRepository.findOne({
            where: { id: payload.orderId },
            relations: ['equipments']
        });

        if (!order || !order.diagnosis || !order.reportedDefect || !order.tenantId) {
            return;
        }

        const equipment = order.equipments?.[0];
        if (!equipment || !equipment.model || !equipment.brand) {
            return;
        }

        const symptom = order.reportedDefect.trim();
        const diagnosis = order.diagnosis.trim();
        const model = equipment.model.trim();
        const price = Number(order.finalValue) || 0;

        const repairTime = order.exitDate && order.entryDate
            ? Math.floor((order.exitDate.getTime() - order.entryDate.getTime()) / 60000)
            : 0;

        let pattern = await this.pricingRepository.findOne({
            where: {
                tenantId: order.tenantId,
                model,
                symptom,
                diagnosis,
            }
        });

        if (pattern) {
            pattern.repair_count += 1;

            // Recalculate rolling average price
            pattern.avg_price = ((Number(pattern.avg_price) * (pattern.repair_count - 1)) + price) / pattern.repair_count;

            // Update min/max bounds
            if (price < Number(pattern.min_price)) pattern.min_price = price;
            if (price > Number(pattern.max_price)) pattern.max_price = price;

            if (repairTime > 0) {
                pattern.avg_repair_time = Math.floor(((pattern.avg_repair_time * (pattern.repair_count - 1)) + repairTime) / pattern.repair_count);
            }
            await this.pricingRepository.save(pattern);
        } else {
            pattern = this.pricingRepository.create({
                tenantId: order.tenantId,
                equipment_type: equipment.type,
                brand: equipment.brand,
                model,
                symptom,
                diagnosis,
                avg_price: price,
                min_price: price,
                max_price: price,
                repair_count: 1,
                avg_repair_time: repairTime > 0 ? repairTime : 0
            });
            await this.pricingRepository.save(pattern);
        }
    }
}
