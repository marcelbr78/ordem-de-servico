import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
    private readonly logger = new Logger(AuditService.name);

    constructor(
        @InjectRepository(AuditLog)
        private auditRepository: Repository<AuditLog>,
    ) { }

    async log(userId: string | null, action: string, resource: string, resourceId: string | null, details: any, ip: string | null = null, tenantId: string | null = null) {
        try {
            const log = this.auditRepository.create({
                userId,
                tenantId,
                action,
                resource,
                resourceId: resourceId ? String(resourceId) : null,
                details: JSON.stringify(details),
                ipAddress: ip,
            });
            await this.auditRepository.save(log);
        } catch (error) {
            this.logger.error(`Failed to create audit log: ${error.message}`);
        }
    }

    async findAll(limit: number = 100, tenantId?: string) {
        // Filtra por tenant quando disponível; mantém compatibilidade com logs antigos (tenantId null)
        const where = tenantId ? [{ tenantId }, { tenantId: null }] : undefined;
        return this.auditRepository.find({
            where,
            take: limit,
            order: { createdAt: 'DESC' },
            relations: ['user'],
        });
    }

    async findGlobal(limit: number = 500) {
        // Acesso global intencional — apenas super_admin
        return this.auditRepository.find({
            take: limit,
            order: { createdAt: 'DESC' },
            relations: ['user', 'user.tenant'],
        });
    }

    async findByResource(resource: string, resourceId: string, tenantId?: string) {
        // Inclui logs do tenant + logs sem tenant (registros antigos)
        const where = tenantId
            ? [{ resource, resourceId: String(resourceId), tenantId }, { resource, resourceId: String(resourceId), tenantId: null }]
            : [{ resource, resourceId: String(resourceId) }];
        return this.auditRepository.find({
            where,
            order: { createdAt: 'DESC' },
            relations: ['user'],
        });
    }
}
