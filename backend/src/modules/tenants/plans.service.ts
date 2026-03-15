import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from './entities/plan.entity';

@Injectable()
export class PlansService {
    constructor(@InjectRepository(Plan) private repo: Repository<Plan>) {}

    async findAll(): Promise<Plan[]> {
        return this.repo.find({ order: { price: 'ASC' } });
    }

    async findOne(id: string): Promise<Plan> {
        const p = await this.repo.findOne({ where: { id } });
        if (!p) throw new NotFoundException('Plano não encontrado');
        return p;
    }

    async create(data: Partial<Plan>): Promise<Plan> {
        const plan = this.repo.create(data);
        return this.repo.save(plan);
    }

    async update(id: string, data: Partial<Plan>): Promise<Plan> {
        await this.findOne(id);
        await this.repo.update(id, data);
        return this.findOne(id);
    }

    async remove(id: string): Promise<void> {
        await this.findOne(id);
        await this.repo.delete(id);
    }

    async checkOsLimit(tenantId: string, currentCount: number): Promise<void> {
        // Buscar subscription do tenant para verificar limite
        // Por ora, sem restrição hard — pode ser implementado depois
        return;
    }
}
