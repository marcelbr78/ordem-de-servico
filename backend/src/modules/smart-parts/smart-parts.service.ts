import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderService } from '../orders/entities/order-service.entity';
import { Quote, QuoteStatus } from '../smartparts/entities/quote.entity';

@Injectable()
export class SmartPartsService {
    private readonly logger = new Logger(SmartPartsService.name);

    constructor(
        @InjectRepository(OrderService)
        private readonly ordersRepository: Repository<OrderService>,
    ) { }

    async getSuggestions(tenantId: string, model: string, symptom: string, diagnosis: string) {
        if (!model || !symptom || !diagnosis) return [];

        try {
            const results = await this.ordersRepository.createQueryBuilder('order')
                .innerJoin('order.equipments', 'eq')
                .innerJoin(Quote, 'quote', 'quote.orderId = order.id')
                .select('quote.productName', 'part_name')
                .addSelect('COUNT(quote.id)', 'frequency')
                .addSelect('AVG(quote.bestPrice)', 'avg_price')
                .where('order.tenantId = :tenantId', { tenantId })
                .andWhere('order.diagnosis = :diagnosis', { diagnosis })
                .andWhere('eq.model = :model', { model })
                .andWhere('eq.reportedDefect = :symptom', { symptom })
                .andWhere('quote.status = :status', { status: QuoteStatus.COMPLETED })
                .groupBy('quote.productName')
                .orderBy('frequency', 'DESC')
                .limit(5)
                .getRawMany();

            return results.map((row, index) => ({
                id: `dynamic_${index}_${row.part_name}`,
                part_name: row.part_name,
                frequency: parseInt(row.frequency, 10),
                avg_price: parseFloat(row.avg_price) || 0
            }));
        } catch (error) {
            this.logger.error(`Error building dynamic smart parts relation: ${error.message}`);
            return [];
        }
    }
}
