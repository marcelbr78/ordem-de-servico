import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RepairPricePattern } from './entities/repair-price-pattern.entity';

@Injectable()
export class SmartPricingService {
    constructor(
        @InjectRepository(RepairPricePattern)
        private pricingRepository: Repository<RepairPricePattern>,
    ) { }

    async getSuggestion(tenantId: string, model: string, symptom: string) {
        if (!model || !symptom) return null;

        const pattern = await this.pricingRepository.findOne({
            where: { tenantId, model, symptom },
            order: { repair_count: 'DESC' }, // Get the most confident pattern
        });

        if (!pattern) return null;

        return {
            diagnosis: pattern.diagnosis,
            avg_price: Number(pattern.avg_price),
            min_price: Number(pattern.min_price),
            max_price: Number(pattern.max_price),
            avg_repair_time: pattern.avg_repair_time,
            repair_count: pattern.repair_count
        };
    }
}
