import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../guards/super-admin.guard';
import { Broadcast, BroadcastStatus, BroadcastTarget, BroadcastChannel } from './broadcast.entity';
import { Tenant, TenantStatus } from '../../modules/tenants/entities/tenant.entity';
import { WhatsappService } from '../../modules/whatsapp/whatsapp.service';
import { DataSource } from 'typeorm';

@Controller('admin/broadcasts')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class BroadcastsController {
    constructor(
        @InjectRepository(Broadcast) private broadcastRepo: Repository<Broadcast>,
        @InjectRepository(Tenant) private tenantRepo: Repository<Tenant>,
        private whatsappService: WhatsappService,
        private dataSource: DataSource,
    ) {}

    @Get()
    findAll() { return this.broadcastRepo.find({ order: { createdAt: 'DESC' } }); }

    @Post()
    create(@Body() body: Partial<Broadcast>) {
        const b = this.broadcastRepo.create({ ...body, status: BroadcastStatus.DRAFT });
        return this.broadcastRepo.save(b);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() body: Partial<Broadcast>) {
        return this.broadcastRepo.update(id, body).then(() => this.broadcastRepo.findOneBy({ id }));
    }

    @Post(':id/send')
    async send(@Param('id') id: string) {
        const b = await this.broadcastRepo.findOneBy({ id });
        if (!b || b.status === BroadcastStatus.SENT) throw new Error('Inválido');

        // Buscar tenants alvo
        let tenants: Tenant[] = [];
        if (b.target === BroadcastTarget.ALL) tenants = await this.tenantRepo.find();
        else if (b.target === BroadcastTarget.TRIAL) tenants = await this.tenantRepo.find({ where: { status: TenantStatus.TRIAL } });
        else if (b.target === BroadcastTarget.ACTIVE) tenants = await this.tenantRepo.find({ where: { status: TenantStatus.ACTIVE } });
        else if (b.target === BroadcastTarget.PAST_DUE) tenants = await this.tenantRepo.find({ where: { status: TenantStatus.PAST_DUE } });
        else if (b.target === BroadcastTarget.SUSPENDED) tenants = await this.tenantRepo.find({ where: { status: TenantStatus.SUSPENDED } });

        if (b.channel === BroadcastChannel.IN_APP) {
            // Salvar notificação in-app para cada tenant (via admin_notifications)
            for (const t of tenants) {
                await this.dataSource.query(
                    `INSERT INTO admin_notifications (id, "tenantId", title, body, read, "createdAt") VALUES (gen_random_uuid(), $1, $2, $3, false, NOW())`,
                    [t.id, b.title, b.body]
                ).catch(() => {});
            }
        } else if (b.channel === BroadcastChannel.WHATSAPP) {
            // Enviar para o WhatsApp principal de cada tenant
            for (const t of tenants) {
                const phone = (t as any).phone;
                if (phone) {
                    await this.whatsappService.sendMessage(phone.replace(/\D/g,''), `*${b.title}*\n\n${b.body}`).catch(() => {});
                }
            }
        }

        await this.broadcastRepo.update(id, { status: BroadcastStatus.SENT, sentAt: new Date(), recipientCount: tenants.length });
        return this.broadcastRepo.findOneBy({ id });
    }

    @Get('preview/:target')
    async previewCount(@Param('target') target: string) {
        const map: Record<string, any> = {
            all: {}, trial: { status: TenantStatus.TRIAL },
            active: { status: TenantStatus.ACTIVE },
            past_due: { status: TenantStatus.PAST_DUE },
            suspended: { status: TenantStatus.SUSPENDED },
        };
        const count = await this.tenantRepo.count({ where: map[target] || {} });
        return { count };
    }
}
