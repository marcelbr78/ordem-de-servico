import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AuditController {
    constructor(private readonly auditService: AuditService) { }

    @Get()
    async findAll(@Query('limit') limit: number) {
        return this.auditService.findAll(limit || 100);
    }

    @Get('resource')
    async findByResource(@Query('resource') resource: string, @Query('id') id: string) {
        return this.auditService.findByResource(resource, id);
    }
}
