import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../guards/super-admin.guard';
import { SupportTicket, TicketMessage, TicketStatus, TicketPriority, TicketCategory } from './support-ticket.entity';

@Controller('admin/support')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class SupportController {
    constructor(
        @InjectRepository(SupportTicket) private ticketRepo: Repository<SupportTicket>,
        @InjectRepository(TicketMessage) private msgRepo: Repository<TicketMessage>,
    ) {}

    @Get('tickets')
    async list(
        @Query('status') status?: string,
        @Query('priority') priority?: string,
        @Query('page') page = '1',
    ) {
        const qb = this.ticketRepo.createQueryBuilder('t')
            .leftJoinAndSelect('t.tenant', 'tenant')
            .leftJoinAndSelect('t.messages', 'msgs')
            .orderBy('t.createdAt', 'DESC')
            .skip((parseInt(page) - 1) * 20).take(20);
        if (status) qb.andWhere('t.status = :status', { status });
        if (priority) qb.andWhere('t.priority = :priority', { priority });
        const [data, total] = await qb.getManyAndCount();
        return { data, total, page: parseInt(page) };
    }

    @Get('tickets/stats')
    async stats() {
        const counts = await this.ticketRepo.createQueryBuilder('t')
            .select('t.status', 'status').addSelect('COUNT(*)', 'count')
            .groupBy('t.status').getRawMany();
        const priorityCounts = await this.ticketRepo.createQueryBuilder('t')
            .select('t.priority', 'priority').addSelect('COUNT(*)', 'count')
            .where("t.status NOT IN ('resolved','closed')")
            .groupBy('t.priority').getRawMany();
        return { byStatus: counts, byPriority: priorityCounts };
    }

    @Get('tickets/:id')
    async getOne(@Param('id') id: string) {
        return this.ticketRepo.findOne({
            where: { id },
            relations: ['messages', 'tenant'],
        });
    }

    @Post('tickets')
    async create(@Body() body: { tenantId?: string; title: string; description: string; category?: TicketCategory; priority?: TicketPriority }, @Req() req: any) {
        const ticket = this.ticketRepo.create({
            ...body,
            status: TicketStatus.OPEN,
            priority: body.priority || TicketPriority.MEDIUM,
            category: body.category || TicketCategory.OTHER,
        });
        const saved = await this.ticketRepo.save(ticket);
        return saved;
    }

    @Patch('tickets/:id')
    async update(@Param('id') id: string, @Body() body: Partial<SupportTicket>) {
        if (body.status === TicketStatus.RESOLVED && !body.resolvedAt) {
            (body as any).resolvedAt = new Date();
        }
        await this.ticketRepo.update(id, body);
        return this.ticketRepo.findOne({ where: { id }, relations: ['messages', 'tenant'] });
    }

    @Post('tickets/:id/messages')
    async addMessage(@Param('id') id: string, @Body() body: { content: string; isStaff?: boolean; authorName?: string }, @Req() req: any) {
        const msg = this.msgRepo.create({
            ticketId: id,
            content: body.content,
            isStaff: body.isStaff ?? true,
            authorName: body.authorName || req.user?.name || 'Admin',
            authorId: req.user?.id,
        });
        const saved = await this.msgRepo.save(msg);
        // Se for resposta do staff, mover para in_progress
        if (body.isStaff) {
            await this.ticketRepo.update(id, { status: TicketStatus.IN_PROGRESS });
        }
        return saved;
    }
}

// ── Controller público para tenants criarem tickets ────────────
import { Controller as Ctrl2 } from '@nestjs/common';

@Ctrl2('support')
@UseGuards(JwtAuthGuard)
export class TenantSupportController {
    constructor(
        @InjectRepository(SupportTicket) private ticketRepo: Repository<SupportTicket>,
        @InjectRepository(TicketMessage) private msgRepo: Repository<TicketMessage>,
    ) {}

    @Get('tickets')
    async myTickets(@Req() req: any) {
        return this.ticketRepo.find({
            where: { tenantId: req.user?.tenantId },
            relations: ['messages'],
            order: { createdAt: 'DESC' },
        });
    }

    @Post('tickets')
    async openTicket(@Body() body: { title: string; description: string; category?: TicketCategory; priority?: TicketPriority }, @Req() req: any) {
        const ticket = this.ticketRepo.create({
            ...body,
            tenantId: req.user?.tenantId,
            userId: req.user?.id,
            status: TicketStatus.OPEN,
            priority: body.priority || TicketPriority.MEDIUM,
        });
        return this.ticketRepo.save(ticket);
    }

    @Post('tickets/:id/messages')
    async reply(@Param('id') id: string, @Body() body: { content: string }, @Req() req: any) {
        const ticket = await this.ticketRepo.findOne({ where: { id, tenantId: req.user?.tenantId } });
        if (!ticket) return { error: 'Ticket não encontrado' };
        const msg = this.msgRepo.create({
            ticketId: id, content: body.content,
            isStaff: false, authorName: req.user?.name, authorId: req.user?.id,
        });
        if (ticket.status === TicketStatus.WAITING) {
            await this.ticketRepo.update(id, { status: TicketStatus.IN_PROGRESS });
        }
        return this.msgRepo.save(msg);
    }
}
