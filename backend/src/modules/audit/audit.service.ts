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

    async log(userId: string | null, action: string, resource: string, resourceId: string | null, details: any, ip: string | null = null) {
        try {
            const log = this.auditRepository.create({
                userId,
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

    async findAll(limit: number = 100) {
        return this.auditRepository.find({
            take: limit,
            order: { createdAt: 'DESC' },
            relations: ['user'],
        });
    }

    async findByResource(resource: string, resourceId: string) {
        return this.auditRepository.find({
            where: { resource, resourceId: String(resourceId) },
            order: { createdAt: 'DESC' },
            relations: ['user'],
        });
    }
}
