import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '../../modules/tenants/entities/subscription.entity';
import { Plan } from '../../modules/tenants/entities/plan.entity';

@Injectable()
export class SubscriptionsService {
    constructor(
        @InjectRepository(Subscription)
        private subscriptionsRepository: Repository<Subscription>,
        @InjectRepository(Plan)
        private plansRepository: Repository<Plan>,
    ) { }

    async findAll() {
        return this.subscriptionsRepository.find({
            relations: ['tenant', 'plan'],
            order: { createdAt: 'DESC' }
        });
    }

    async findOne(id: string) {
        const sub = await this.subscriptionsRepository.findOne({
            where: { id },
            relations: ['tenant', 'plan']
        });
        if (!sub) throw new NotFoundException('Assinatura não encontrada');
        return sub;
    }

    async updatePlan(id: string, planId: string) {
        const sub = await this.findOne(id);

        const plan = await this.plansRepository.findOne({ where: { id: planId } });
        if (!plan) throw new NotFoundException('Plano de destino não encontrado');

        sub.planId = plan.id;
        sub.plan = plan;

        return this.subscriptionsRepository.save(sub);
    }
}
