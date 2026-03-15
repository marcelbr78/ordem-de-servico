import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';

@Injectable()
export class TenantsService {
    constructor(
        @InjectRepository(Tenant) private repo: Repository<Tenant>,
    ) {}

    async findById(id: string): Promise<Tenant> {
        const t = await this.repo.findOne({ where: { id } });
        if (!t) throw new NotFoundException('Tenant não encontrado');
        return t;
    }

    async findBySubdomain(subdomain: string): Promise<Tenant | null> {
        return this.repo.findOne({ where: { subdomain } });
    }
}
