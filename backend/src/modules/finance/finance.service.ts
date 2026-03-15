import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Transaction, TransactionType, TransactionStatus } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { BankAccount } from '../bank-accounts/entities/bank-account.entity';

@Injectable()
export class FinanceService {
    constructor(
        @InjectRepository(Transaction)
        private txRepo: Repository<Transaction>,
    ) {}

    async create(dto: CreateTransactionDto, manager?: EntityManager): Promise<any> {
        const repo = manager ? manager.getRepository(Transaction) : this.txRepo;
        const status = (dto as any).status || ((dto as any).dueDate ? TransactionStatus.PENDING : TransactionStatus.PAID);
        const txData: any = {
            ...dto,
            status,
            competenceDate: (dto as any).competenceDate || (dto as any).paidDate || new Date().toISOString().slice(0, 10),
        };
        const tx = repo.create(txData);
        const saved: any = await repo.save(tx);

        // Atualiza saldo da conta bancária se pago e conta informada
        if (saved.status === TransactionStatus.PAID && dto.bankAccountId && manager) {
            const bankRepo = manager.getRepository(BankAccount);
            const account = await bankRepo.findOne({ where: { id: dto.bankAccountId } });
            if (account) {
                const delta = dto.type === TransactionType.INCOME ? +Number(dto.amount) : -Number(dto.amount);
                account.currentBalance = Number(account.currentBalance) + delta;
                await bankRepo.save(account);
            }
        }
        return saved;
    }

    async update(id: string, dto: Partial<CreateTransactionDto>): Promise<any> {
        const tx = await this.txRepo.findOne({ where: { id } });
        if (!tx) throw new Error('Transação não encontrada');
        Object.assign(tx, dto);
        return this.txRepo.save(tx);
    }

    async remove(id: string): Promise<void> {
        await this.txRepo.delete(id);
    }

    async findAll(filters?: {
        from?: string; to?: string; type?: string; status?: string;
        category?: string; search?: string;
    }): Promise<any[]> {
        const qb = this.txRepo.createQueryBuilder('tx').orderBy('tx.createdAt', 'DESC');

        if (filters?.from)     qb.andWhere('tx.createdAt >= :from', { from: filters.from + 'T00:00:00' });
        if (filters?.to)       qb.andWhere('tx.createdAt <= :to',   { to: filters.to + 'T23:59:59' });
        if (filters?.type)     qb.andWhere('tx.type = :type',       { type: filters.type.toUpperCase() });
        if (filters?.category) qb.andWhere('tx.category = :cat',    { cat: filters.category });
        if (filters?.search)   qb.andWhere('(tx.description LIKE :q OR tx.description LIKE :q)', { q: `%${filters.search}%` });

        // status e campos novos — tratados como any para compatibilidade
        if (filters?.status) {
            try { qb.andWhere('tx.status = :status', { status: filters.status }); } catch {}
        }

        return qb.getMany();
    }

    async findByOrder(orderId: string): Promise<any[]> {
        return this.txRepo.find({ where: { orderId }, order: { createdAt: 'DESC' } });
    }

    async getSummary(from?: string, to?: string): Promise<any> {
        const all: any[] = await this.findAll({ from, to });
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

    async getDre(year: number): Promise<any[]> {
        const all: any[] = await this.txRepo.find();
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

    async getUpcoming(days = 30): Promise<any[]> {
        const limit = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
        const all: any[] = await this.txRepo.find();
        return all.filter((t: any) =>
            (t.status === 'pending' || t.status === 'overdue') &&
            (!t.dueDate || t.dueDate <= limit)
        ).sort((a: any, b: any) => (a.dueDate || '').localeCompare(b.dueDate || ''));
    }

    async getCashFlow(days = 30): Promise<any[]> {
        const today = new Date();
        const result: any[] = [];
        const paid: any[] = await this.txRepo.find();
        let runningBalance = paid
            .filter((t: any) => !t.status || t.status === 'paid')
            .reduce((s: number, t: any) => s + (t.type === 'INCOME' ? +Number(t.amount) : -Number(t.amount)), 0);

        for (let i = 0; i < days; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() + i);
            const dateStr = d.toISOString().slice(0, 10);
            const dayTxs: any[] = await this.txRepo.find({ where: { dueDate: dateStr } as any });
            const income  = dayTxs.filter((t: any) => t.type === 'INCOME') .reduce((s: number, t: any) => s + Number(t.amount), 0);
            const expense = dayTxs.filter((t: any) => t.type === 'EXPENSE').reduce((s: number, t: any) => s + Number(t.amount), 0);
            runningBalance += income - expense;
            if (income > 0 || expense > 0) result.push({ date: dateStr, income, expense, balance: runningBalance });
        }
        return result;
    }

    async getByCategory(from?: string, to?: string): Promise<any[]> {
        const all: any[] = await this.findAll({ from, to });
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
