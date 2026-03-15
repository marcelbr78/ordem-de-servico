import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppEvent, WorkOrderStatusChangedPayload } from '../events/event-types';
import { OrderService, OSStatus } from '../orders/entities/order-service.entity';
import { DiagnosticPattern } from './entities/diagnostic-pattern.entity';

@Injectable()
export class SmartDiagnosticsListener {
    constructor(
        @InjectRepository(OrderService) // Using repository directly to avoid service coupled logic
        private ordersRepository: Repository<OrderService>,
        @InjectRepository(DiagnosticPattern)
        private diagnosticRepository: Repository<DiagnosticPattern>,
    ) { }

    @OnEvent(AppEvent.WORK_ORDER_STATUS_CHANGED)
    async handleOrderCompleted(payload: WorkOrderStatusChangedPayload) {
        if (payload.newStatus !== OSStatus.FINALIZADA && payload.newStatus !== OSStatus.ENTREGUE) {
            return;
        }

        // Fetch order with equipment to get data
        const order = await this.ordersRepository.findOne({
            where: { id: payload.orderId },
            relations: ['equipments'] // Assuming equipment holds model/brand
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

        // Calculate repair time in minutes
        const repairTime = order.exitDate && order.entryDate
            ? Math.floor((order.exitDate.getTime() - order.entryDate.getTime()) / 60000)
            : 0;

        const price = Number(order.finalValue) || 0;

        let pattern = await this.diagnosticRepository.findOne({
            where: {
                tenantId: order.tenantId,
                model,
                symptom,
                diagnosis,
            }
        });

        if (pattern) {
            // Update rolling averages
            pattern.frequency += 1;
            pattern.avg_price = ((Number(pattern.avg_price) * (pattern.frequency - 1)) + price) / pattern.frequency;
            if (repairTime > 0) {
                pattern.avg_repair_time = Math.floor(((pattern.avg_repair_time * (pattern.frequency - 1)) + repairTime) / pattern.frequency);
            }
            await this.diagnosticRepository.save(pattern);
        } else {
            // Create new pattern
            pattern = this.diagnosticRepository.create({
                tenantId: order.tenantId,
                equipment_type: equipment.type,
                brand: equipment.brand,
                model,
                symptom,
                diagnosis,
                frequency: 1,
                avg_price: price,
                avg_repair_time: repairTime > 0 ? repairTime : 0
            });
            await this.diagnosticRepository.save(pattern);
        }
    }
}
