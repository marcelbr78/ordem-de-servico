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

    async create(data: {
        name: string;
        subdomain?: string;
        ownerEmail?: string;
        phone?: string;
        city?: string;
        cnpj?: string;
    }): Promise<any> {
        // Gerar subdomain único a partir do nome
        const subdomain = data.subdomain ||
            data.name.toLowerCase()
                .normalize('NFD').replace(/[̀-ͯ]/g, '')
                .replace(/[^a-z0-9]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '')
                .slice(0, 30) + '-' + Date.now().toString().slice(-4);

        const tenant = this.repo.create({
            name: data.name,
            subdomain,
            status: 'trial',
            trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 dias
        } as any);
        return this.repo.save(tenant);
    }

    async findAll(): Promise<any[]> {
        return (this.repo as any).find({ order: { createdAt: 'DESC' } });
    }
}
