import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, DataSource } from 'typeorm';
import { Transaction, TransactionType, TransactionStatus } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { BankAccount } from '../bank-accounts/entities/bank-account.entity';

@Injectable()
export class FinanceService {
    constructor(
        @InjectRepository(Transaction)
        private txRepo: Repository<Transaction>,
        private dataSource: DataSource,
    ) {}

    async create(dto: CreateTransactionDto, tenantId?: string, manager?: EntityManager): Promise<any> {
        // Idempotência: previne criação duplicada de pagamento de OS
        // Protege tanto contra double-click quanto contra execução dupla no fluxo event-driven
        if (dto.orderId && dto.category === 'Pagamento de OS' && dto.type === TransactionType.INCOME) {
            const checkRepo = manager ? manager.getRepository(Transaction) : this.txRepo;
            const existing = await checkRepo.findOne({
                where: { orderId: dto.orderId, category: 'Pagamento de OS', type: TransactionType.INCOME },
            });
            if (existing) {
                console.log(`[FinanceService] Pagamento já registrado para OS ${dto.orderId} — retornando existente (idempotência)`);
                return existing;
            }
        }

        if (manager) {
            // Caso 1: manager externo (dentro de transaction do changeStatus) — comportamento atual
            return this._executeCreate(dto, tenantId, manager);
        } else {
            // Caso 2: sem manager externo (event handler) — transaction interna via DataSource
            return this.dataSource.transaction((txManager) => this._executeCreate(dto, tenantId, txManager));
        }
    }

    private async _executeCreate(dto: CreateTransactionDto, tenantId: string | undefined, manager: EntityManager): Promise<any> {
        const repo = manager.getRepository(Transaction);
        const status = (dto as any).status || ((dto as any).dueDate ? TransactionStatus.PENDING : TransactionStatus.PAID);
        const txData: any = {
            ...dto,
            status,
            tenantId: tenantId || (dto as any).tenantId,
            competenceDate: (dto as any).competenceDate || (dto as any).paidDate || new Date().toISOString().slice(0, 10),
        };
        const tx = repo.create(txData);
        const saved: any = await repo.save(tx);

        // Atualiza saldo da conta bancária se pago e conta informada
        if (saved.status === TransactionStatus.PAID && dto.bankAccountId) {
            if (!tenantId) throw new UnauthorizedException('Tenant obrigatório');
            const bankRepo = manager.getRepository(BankAccount);
            const account = await bankRepo.findOne({ where: { id: dto.bankAccountId, tenantId } });
            if (account) {
                const delta = dto.type === TransactionType.INCOME ? +Number(dto.amount) : -Number(dto.amount);
                account.currentBalance = Number(account.currentBalance) + delta;
                await bankRepo.save(account);
            }
        }
        return saved;
    }

    async update(id: string, dto: Partial<CreateTransactionDto>, tenantId?: string): Promise<any> {
        const where = tenantId ? { id, tenantId } : { id };
        const tx = await this.txRepo.findOne({ where });
        if (!tx) throw new Error('Transação não encontrada');
        Object.assign(tx, dto);
        return this.txRepo.save(tx);
    }

    async remove(id: string, tenantId?: string): Promise<void> {
        await this.txRepo.delete(tenantId ? { id, tenantId } : id);
    }

    async findAll(filters?: {
        from?: string; to?: string; type?: string; status?: string;
        category?: string; search?: string; tenantId?: string;
    }): Promise<any[]> {
        const qb = this.txRepo.createQueryBuilder('tx').orderBy('tx.createdAt', 'DESC');

        if (filters?.tenantId) qb.andWhere('tx.tenantId = :tenantId', { tenantId: filters.tenantId });
        if (filters?.from)     qb.andWhere('tx.createdAt >= :from', { from: filters.from + 'T00:00:00' });
        if (filters?.to)       qb.andWhere('tx.createdAt <= :to',   { to: filters.to + 'T23:59:59' });
        if (filters?.type)     qb.andWhere('tx.type = :type',       { type: filters.type.toUpperCase() });
        if (filters?.category) qb.andWhere('tx.category = :cat',    { cat: filters.category });
        if (filters?.search)   qb.andWhere('tx.description LIKE :q', { q: `%${filters.search}%` });

        if (filters?.status) {
            try { qb.andWhere('tx.status = :status', { status: filters.status }); } catch {}
        }

        return qb.getMany();
    }

    async findByOrder(orderId: string, tenantId?: string): Promise<any[]> {
        const where = tenantId ? { orderId, tenantId } : { orderId };
        return this.txRepo.find({ where, order: { createdAt: 'DESC' } });
    }

    async getSummary(from?: string, to?: string, tenantId?: string): Promise<any> {
        const all: any[] = await this.findAll({ from, to, tenantId });
        const paid = all.filter((t: any) => !t.status || t.status === 'paid' || t.status === TransactionStatus.PAID);

        const totalIncome  = paid.filter((t: any) => t.type === TransactionType.INCOME || t.type === 'INCOME')
            .reduce((s: number, t: any) => s + Number(t.amount), 0);
        const totalExpense = paid.filter((t: any) => t.type === TransactionType.EXPENSE || t.type === 'EXPENSE')
            .reduce((s: number, t: any) => s + Number(t.amount), 0);

        const pending = all.filter((t: any) => t.status === 'pending' || t.status === TransactionStatus.PENDING);
        const aReceber = pending.filter((t: any) => t.type === TransactionType.INCOME || t.type === 'INCOME')
            .reduce((s: number, t: any) => s + Number(t.amount), 0);
        const aPagar = pending.filter((t: any) => t.type === TransactionType.EXPENSE || t.type === 'EXPENSE')
            .reduce((s: number, t: any) => s + Number(t.amount), 0);

        const today = new Date().toISOString().slice(0, 10);
        const overdue = all.filter((t: any) =>
            (t.status === 'pending' || t.status === TransactionStatus.PENDING) &&
            t.dueDate && t.dueDate < today
        );
        const vencidos = overdue.reduce((s: number, t: any) => s + Number(t.amount), 0);

        return { totalIncome, totalExpense, balance: totalIncome - totalExpense, aReceber, aPagar, vencidos, totalTransactions: all.length };
    }

    async getDre(year: number, tenantId?: string): Promise<any[]> {
        const where: any = tenantId ? { tenantId } : {};
        const all: any[] = await this.txRepo.find({ where });
        const months = Array.from({ length: 12 }, (_, i) => {
            const m = String(i + 1).padStart(2, '0');
            const txMonth = all.filter((t: any) => {
                const d = t.competenceDate || t.createdAt?.toISOString?.()?.slice(0, 7) || '';
                return d.startsWith(`${year}-${m}`);
            });
            const income  = txMonth.filter((t: any) => (t.type === 'INCOME')  && (!t.status || t.status === 'paid')).reduce((s: number, t: any) => s + Number(t.amount), 0);
            const expense = txMonth.filter((t: any) => (t.type === 'EXPENSE') && (!t.status || t.status === 'paid')).reduce((s: number, t: any) => s + Number(t.amount), 0);
            return { month: `${year}-${m}`, income, expense, profit: income - expense, margin: income > 0 ? ((income - expense) / income) * 100 : 0 };
        });
        return months;
    }

    async getUpcoming(days = 30, tenantId?: string): Promise<any[]> {
        const limit = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
        const where: any = tenantId ? { tenantId } : {};
        const all: any[] = await this.txRepo.find({ where });
        return all.filter((t: any) =>
            (t.status === 'pending' || t.status === 'overdue') &&
            (!t.dueDate || t.dueDate <= limit)
        ).sort((a: any, b: any) => (a.dueDate || '').localeCompare(b.dueDate || ''));
    }

    async getCashFlow(days = 30, tenantId?: string): Promise<any[]> {
        const today = new Date();
        const result: any[] = [];
        const baseWhere: any = tenantId ? { tenantId } : {};
        const paid: any[] = await this.txRepo.find({ where: baseWhere });
        let runningBalance = paid
            .filter((t: any) => !t.status || t.status === 'paid')
            .reduce((s: number, t: any) => s + (t.type === 'INCOME' ? +Number(t.amount) : -Number(t.amount)), 0);

        for (let i = 0; i < days; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() + i);
            const dateStr = d.toISOString().slice(0, 10);
            const dayWhere: any = { dueDate: dateStr, ...(tenantId ? { tenantId } : {}) };
            const dayTxs: any[] = await this.txRepo.find({ where: dayWhere });
            const income  = dayTxs.filter((t: any) => t.type === 'INCOME') .reduce((s: number, t: any) => s + Number(t.amount), 0);
            const expense = dayTxs.filter((t: any) => t.type === 'EXPENSE').reduce((s: number, t: any) => s + Number(t.amount), 0);
            runningBalance += income - expense;
            if (income > 0 || expense > 0) result.push({ date: dateStr, income, expense, balance: runningBalance });
        }
        return result;
    }

    async getByCategory(from?: string, to?: string, tenantId?: string): Promise<any[]> {
        const all: any[] = await this.findAll({ from, to, tenantId });
        const map: Record<string, { income: number; expense: number }> = {};
        for (const tx of all.filter((t: any) => !t.status || t.status === 'paid')) {
            if (!map[tx.category]) map[tx.category] = { income: 0, expense: 0 };
            if (tx.type === 'INCOME')  map[tx.category].income  += Number(tx.amount);
            if (tx.type === 'EXPENSE') map[tx.category].expense += Number(tx.amount);
        }
        return Object.entries(map)
            .map(([category, vals]) => ({ category, ...vals }))
            .sort((a, b) => (b.income + b.expense) - (a.income + a.expense));
    }
}
