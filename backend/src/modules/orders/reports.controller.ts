import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderService as OS, OSStatus } from './entities/order-service.entity';
import { Transaction, TransactionType } from '../finance/entities/transaction.entity';
import { OrderPart } from './entities/order-part.entity';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
    constructor(
        @InjectRepository(OS) private ordersRepo: Repository<OS>,
        @InjectRepository(Transaction) private txRepo: Repository<Transaction>,
        @InjectRepository(OrderPart) private partsRepo: Repository<OrderPart>,
    ) {}

    @Get('overview')
    async getOverview(@Query('from') from: string, @Query('to') to: string, @Req() req: any) {
        const tenantId = req.user?.tenantId;
        const dateFrom = from ? new Date(from) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const dateTo = to ? new Date(to) : new Date();
        dateTo.setHours(23, 59, 59);

        const base = tenantId ? { tenantId } : {};

        // OS do período
        const orders = await this.ordersRepo
            .createQueryBuilder('o')
            .where(tenantId ? 'o.tenantId = :tenantId' : '1=1', { tenantId })
            .andWhere('o.entryDate >= :from', { from: dateFrom })
            .andWhere('o.entryDate <= :to', { to: dateTo })
            .andWhere('o.deletedAt IS NULL')
            .leftJoinAndSelect('o.equipments', 'eq')
            .getMany();

        // Transações do período
        const txs = await this.txRepo
            .createQueryBuilder('t')
            .where('t.createdAt >= :from', { from: dateFrom })
            .andWhere('t.createdAt <= :to', { to: dateTo })
            .getMany();

        // Métricas básicas
        const totalOS = orders.length;
        const byStatus: Record<string, number> = {};
        Object.values(OSStatus).forEach(s => { byStatus[s] = 0; });
        orders.forEach(o => { byStatus[o.status] = (byStatus[o.status] || 0) + 1; });

        const revenue = txs.filter(t => t.type === TransactionType.INCOME).reduce((s, t) => s + Number(t.amount), 0);
        const expenses = txs.filter(t => t.type === TransactionType.EXPENSE).reduce((s, t) => s + Number(t.amount), 0);

        // Tempo médio de reparo (abertura → entrega) em horas
        const delivered = orders.filter(o => o.status === OSStatus.ENTREGUE && o.exitDate);
        const avgRepairHours = delivered.length
            ? delivered.reduce((s, o) => s + (new Date(o.exitDate).getTime() - new Date(o.entryDate).getTime()) / 3600000, 0) / delivered.length
            : 0;

        // OS por dia (últimos 30 dias para gráfico)
        const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentOrders = await this.ordersRepo
            .createQueryBuilder('o')
            .where(tenantId ? 'o.tenantId = :tenantId' : '1=1', { tenantId })
            .andWhere('o.entryDate >= :from', { from: thirtyDaysAgo })
            .andWhere('o.deletedAt IS NULL')
            .select(['o.entryDate', 'o.finalValue'])
            .getMany();

        const dailyMap: Record<string, { count: number; revenue: number }> = {};
        recentOrders.forEach(o => {
            const day = new Date(o.entryDate).toISOString().slice(0, 10);
            if (!dailyMap[day]) dailyMap[day] = { count: 0, revenue: 0 };
            dailyMap[day].count++;
            dailyMap[day].revenue += Number(o.finalValue) || 0;
        });
        const dailyChart = Object.entries(dailyMap)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, data]) => ({ date, ...data }));

        // Marcas mais frequentes
        const brandMap: Record<string, number> = {};
        orders.forEach(o => {
            const eq = (o as any).equipments?.[0];
            if (eq?.brand) brandMap[eq.brand] = (brandMap[eq.brand] || 0) + 1;
        });
        const topBrands = Object.entries(brandMap)
            .sort(([, a], [, b]) => b - a).slice(0, 6)
            .map(([brand, count]) => ({ brand, count }));

        // Faturamento por mês (últimos 6 meses)
        const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5); sixMonthsAgo.setDate(1);
        const monthlyTxs = await this.txRepo
            .createQueryBuilder('t')
            .where('t.createdAt >= :from', { from: sixMonthsAgo })
            .andWhere('t.type = :type', { type: TransactionType.INCOME })
            .getMany();

        const monthlyMap: Record<string, number> = {};
        monthlyTxs.forEach(t => {
            const key = new Date(t.createdAt).toISOString().slice(0, 7);
            monthlyMap[key] = (monthlyMap[key] || 0) + Number(t.amount);
        });
        const monthlyRevenue = Object.entries(monthlyMap)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, revenue]) => ({ month, revenue: Math.round(revenue) }));

        return {
            period: { from: dateFrom, to: dateTo },
            totals: { totalOS, revenue: Math.round(revenue), expenses: Math.round(expenses), balance: Math.round(revenue - expenses) },
            byStatus,
            avgRepairHours: Math.round(avgRepairHours),
            topBrands,
            dailyChart,
        };
    }

    @Get('technicians')
    async getTechnicianRanking(@Query('from') from: string, @Query('to') to: string, @Req() req: any) {
        const tenantId = req.user?.tenantId;
        const dateFrom = from ? new Date(from) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const dateTo   = to   ? new Date(to)   : new Date();
        dateTo.setHours(23, 59, 59);

        const orders = await this.ordersRepo.createQueryBuilder('o')
            .where(tenantId ? 'o.tenantId = :tenantId' : '1=1', { tenantId })
            .andWhere('o.entryDate >= :from', { from: dateFrom })
            .andWhere('o.entryDate <= :to',   { to: dateTo })
            .andWhere('o.deletedAt IS NULL')
            .andWhere('o.technicianId IS NOT NULL')
            .getMany();

        const map: Record<string, { technicianId: string; total: number; delivered: number; revenue: number; avgHours: number; hours: number[] }> = {};
        orders.forEach(o => {
            const tid = o.technicianId!;
            if (!map[tid]) map[tid] = { technicianId: tid, total: 0, delivered: 0, revenue: 0, avgHours: 0, hours: [] };
            map[tid].total++;
            map[tid].revenue += Number(o.finalValue) || 0;
            if (o.status === OSStatus.ENTREGUE && o.exitDate) {
                map[tid].delivered++;
                map[tid].hours.push((new Date(o.exitDate).getTime() - new Date(o.entryDate).getTime()) / 3600000);
            }
        });

        return Object.values(map).map(t => ({
            ...t,
            avgHours: t.hours.length ? Math.round(t.hours.reduce((s, h) => s + h, 0) / t.hours.length) : 0,
            hours: undefined,
        })).sort((a, b) => b.delivered - a.delivered);
    }

    @Get('parts')
    async getTopParts(@Query('from') from: string, @Query('to') to: string, @Req() req: any) {
        const dateFrom = from ? new Date(from) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const dateTo   = to   ? new Date(to)   : new Date(); dateTo.setHours(23, 59, 59);

        const parts = await this.partsRepo.createQueryBuilder('p')
            .leftJoinAndSelect('p.product', 'prod')
            .where('p.createdAt >= :from', { from: dateFrom })
            .andWhere('p.createdAt <= :to',   { to: dateTo })
            .getMany();

        const map: Record<string, { name: string; count: number; revenue: number }> = {};
        parts.forEach(p => {
            const name = (p as any).product?.name || 'Desconhecido';
            if (!map[name]) map[name] = { name, count: 0, revenue: 0 };
            map[name].count += p.quantity;
            map[name].revenue += Number(p.unitPrice) * p.quantity;
        });
        return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 20);
    }

    @Get('models')
    async getTopModels(@Query('from') from: string, @Query('to') to: string, @Req() req: any) {
        const tenantId = req.user?.tenantId;
        const dateFrom = from ? new Date(from) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const dateTo   = to   ? new Date(to)   : new Date(); dateTo.setHours(23, 59, 59);

        const orders = await this.ordersRepo.createQueryBuilder('o')
            .where(tenantId ? 'o.tenantId = :tenantId' : '1=1', { tenantId })
            .andWhere('o.entryDate >= :from', { from: dateFrom })
            .andWhere('o.entryDate <= :to',   { to: dateTo })
            .andWhere('o.deletedAt IS NULL')
            .leftJoinAndSelect('o.equipments', 'eq')
            .getMany();

        const map: Record<string, { model: string; brand: string; count: number; revenue: number }> = {};
        orders.forEach(o => {
            const eq = (o as any).equipments?.[0];
            if (!eq) return;
            const key = `${eq.brand || '?'} ${eq.model || '?'}`;
            if (!map[key]) map[key] = { model: eq.model || '?', brand: eq.brand || '?', count: 0, revenue: 0 };
            map[key].count++;
            map[key].revenue += Number(o.finalValue) || 0;
        });
        return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 20);
    }

    @Get('warranty-return')
    async getWarrantyReturn(@Query('from') from: string, @Query('to') to: string, @Req() req: any) {
        const tenantId = req.user?.tenantId;
        const orders = await this.ordersRepo.createQueryBuilder('o')
            .where(tenantId ? 'o.tenantId = :tenantId' : '1=1', { tenantId })
            .andWhere('o.deletedAt IS NULL')
            .getMany();
        const total = orders.filter(o => o.status === OSStatus.ENTREGUE).length;
        const warranty = orders.filter(o => (o.reportedDefect || '').toLowerCase().includes('garantia')).length;
        const rate = total > 0 ? (warranty / total * 100) : 0;
        return { total, warrantyReturns: warranty, rate: rate.toFixed(1) };
    }
}
}
