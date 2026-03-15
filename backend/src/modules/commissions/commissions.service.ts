import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Commission, CommissionStatus, CommissionBasis } from './entities/commission.entity';
import { OrderService } from '../orders/entities/order-service.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class CommissionsService {
    constructor(
        @InjectRepository(Commission)
        private commRepo: Repository<Commission>,
        @InjectRepository(OrderService)
        private orderRepo: Repository<OrderService>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
        private settingsService: SettingsService,
    ) {}

    // ── Calcular e gravar comissão ao finalizar/entregar OS ──
    async calculateForOrder(orderId: string, tenantId?: string): Promise<Commission | null> {
        const order = await this.orderRepo.findOne({ where: { id: orderId }, relations: ['parts'] });
        if (!order || !order.technicianId) return null;

        // Não gerar comissão duplicada
        const existing = await this.commRepo.findOne({ where: { orderId } });
        if (existing) return existing;

        // Buscar configurações de comissão
        const settings = await this.settingsService.findAll();
        const map: Record<string, string> = {};
        for (const s of settings) map[s.key] = s.value;

        const enabled = map['finance_commission_enabled'] === 'true';
        if (!enabled) return null;

        // Taxa padrão ou por técnico
        let rate = parseFloat(map['finance_commission_default'] || '10');
        let basis: CommissionBasis = CommissionBasis.SERVICE_VALUE;

        try {
            const rules: Array<{ technicianId: string; rate: number; basis: string }> =
                JSON.parse(map['finance_commission_rules'] || '[]');
            const rule = rules.find(r => r.technicianId === order.technicianId);
            if (rule) {
                rate = rule.rate;
                basis = rule.basis as CommissionBasis || CommissionBasis.SERVICE_VALUE;
            }
        } catch {}

        // Base de cálculo
        const partsTotal = (order.parts || []).reduce((s: number, p: any) => s + Number(p.totalPrice || 0), 0);
        let baseValue = 0;
        if (basis === CommissionBasis.SERVICE_VALUE)  baseValue = Number(order.finalValue) || Number(order.estimatedValue);
        else if (basis === CommissionBasis.PARTS_VALUE)   baseValue = partsTotal;
        else if (basis === CommissionBasis.TOTAL_VALUE)   baseValue = (Number(order.finalValue) || 0) + partsTotal;
        else if (basis === CommissionBasis.FIXED)         baseValue = 1; // rate será o valor fixo

        const commissionValue = basis === CommissionBasis.FIXED ? rate : (baseValue * rate) / 100;
        const now = new Date();
        const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        const comm = this.commRepo.create({
            tenantId,
            technicianId: order.technicianId,
            orderId: order.id,
            orderProtocol: order.protocol,
            baseValue,
            ratePercent: basis === CommissionBasis.FIXED ? 0 : rate,
            commissionValue,
            basis,
            status: CommissionStatus.PENDING,
            paymentPeriod: period,
        });
        return this.commRepo.save(comm);
    }

    // ── Listar comissões com filtros ──────────────────────────
    async findAll(filters?: {
        technicianId?: string; period?: string; status?: string;
        from?: string; to?: string;
    }): Promise<Commission[]> {
        const qb = this.commRepo.createQueryBuilder('c')
            .leftJoinAndSelect('c.technician', 'tech')
            .orderBy('c.createdAt', 'DESC');

        if (filters?.technicianId) qb.andWhere('c.technicianId = :tid', { tid: filters.technicianId });
        if (filters?.period)       qb.andWhere('c.paymentPeriod = :period', { period: filters.period });
        if (filters?.status)       qb.andWhere('c.status = :status', { status: filters.status });
        if (filters?.from)         qb.andWhere('c.createdAt >= :from', { from: filters.from + 'T00:00:00' });
        if (filters?.to)           qb.andWhere('c.createdAt <= :to',   { to:   filters.to   + 'T23:59:59' });

        return qb.getMany();
    }

    // ── Summary por técnico ───────────────────────────────────
    async getSummaryByTechnician(period?: string): Promise<Array<{
        technicianId: string; technicianName: string;
        totalOS: number; totalBase: number; totalCommission: number;
        pendingCount: number; paidCount: number;
    }>> {
        const technicians = await this.userRepo.find({
            where: { role: UserRole.TECHNICIAN, isActive: true },
        });

        const result = await Promise.all(technicians.map(async tech => {
            const qb = this.commRepo.createQueryBuilder('c')
                .where('c.technicianId = :tid', { tid: tech.id });
            if (period) qb.andWhere('c.paymentPeriod = :period', { period });

            const comms = await qb.getMany();
            const totalBase       = comms.reduce((s, c) => s + Number(c.baseValue), 0);
            const totalCommission = comms.reduce((s, c) => s + Number(c.commissionValue), 0);
            const pendingCount    = comms.filter(c => c.status === CommissionStatus.PENDING).length;
            const paidCount       = comms.filter(c => c.status === CommissionStatus.PAID).length;

            return {
                technicianId: tech.id,
                technicianName: tech.name,
                totalOS: comms.length,
                totalBase,
                totalCommission,
                pendingCount,
                paidCount,
            };
        }));

        return result.sort((a, b) => b.totalCommission - a.totalCommission);
    }

    // ── Marcar como pago ──────────────────────────────────────
    async markAsPaid(ids: string[]): Promise<void> {
        await this.commRepo.update(ids, {
            status: CommissionStatus.PAID,
            paidAt: new Date(),
        });
    }

    // ── Marcar todos de um técnico/período como pagos ─────────
    async payPeriod(technicianId: string, period: string): Promise<Commission[]> {
        const comms = await this.commRepo.find({
            where: { technicianId, paymentPeriod: period, status: CommissionStatus.PENDING },
        });
        for (const c of comms) {
            c.status = CommissionStatus.PAID;
            c.paidAt = new Date();
        }
        return this.commRepo.save(comms);
    }

    // ── Ranking de técnicos ───────────────────────────────────
    async getRanking(period?: string) {
        const summary = await this.getSummaryByTechnician(period);
        return summary.sort((a, b) => b.totalOS - a.totalOS);
    }

    // ── Histórico por OS ──────────────────────────────────────
    async findByOrder(orderId: string) {
        return this.commRepo.findOne({ where: { orderId }, relations: ['technician'] });
    }

    // ── Ajuste manual ─────────────────────────────────────────
    async update(id: string, dto: Partial<Commission>) {
        await this.commRepo.update(id, dto);
        return this.commRepo.findOne({ where: { id }, relations: ['technician'] });
    }

    // ── Recalcular: útil quando a regra muda ─────────────────
    async recalculate(commissionId: string): Promise<Commission | null> {
        const comm = await this.commRepo.findOne({ where: { id: commissionId } });
        if (!comm || comm.status === CommissionStatus.PAID) return null;
        await this.commRepo.delete(commissionId);
        return this.calculateForOrder(comm.orderId);
    }
}
