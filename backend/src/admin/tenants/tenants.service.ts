import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../../modules/tenants/entities/tenant.entity';

@Injectable()
export class TenantsService {
    constructor(
        @InjectRepository(Tenant)
        private tenantsRepository: Repository<Tenant>,
    ) { }

    async findAll(page: number = 1, limit: number = 20) {
        const [items, total] = await this.tenantsRepository.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
            order: { createdAt: 'DESC' }
        });

        return {
            data: items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async findOne(id: string) {
        const tenant = await this.tenantsRepository.findOne({ where: { id } });
        if (!tenant) throw new NotFoundException('Tenant não encontrado');
        return tenant;
    }

    async updateStatus(id: string, status: any) {
        const tenant = await this.findOne(id);
        tenant.status = status;
        return this.tenantsRepository.save(tenant);
    }
}
