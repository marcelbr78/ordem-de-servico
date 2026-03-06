import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from '../../modules/tenants/entities/plan.entity';

@Injectable()
export class PlansService {
    constructor(
        @InjectRepository(Plan)
        private plansRepository: Repository<Plan>,
    ) { }

    async findAll() {
        return this.plansRepository.find({ order: { price: 'ASC' } });
    }

    async findOne(id: string) {
        const plan = await this.plansRepository.findOne({ where: { id } });
        if (!plan) throw new NotFoundException('Plano não encontrado');
        return plan;
    }

    async create(data: Partial<Plan>) {
        const plan = this.plansRepository.create(data);
        return this.plansRepository.save(plan);
    }

    async update(id: string, data: Partial<Plan>) {
        const plan = await this.findOne(id);
        Object.assign(plan, data);
        return this.plansRepository.save(plan);
    }

    async remove(id: string): Promise<void> {
        const plan = await this.findOne(id);
        await this.plansRepository.remove(plan);
    }
}

