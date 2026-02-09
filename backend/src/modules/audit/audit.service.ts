import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
    constructor(
        @InjectRepository(AuditLog)
        private auditLogRepository: Repository<AuditLog>,
    ) { }

    async log(data: {
        userId?: string;
        action: string;
        entity: string;
        entityId?: string;
        details?: string;
        ip?: string;
        userAgent?: string;
    }) {
        const auditLog = this.auditLogRepository.create(data);
        return this.auditLogRepository.save(auditLog);
    }
}
