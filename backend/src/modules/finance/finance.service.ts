import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Transaction, TransactionType, TransactionStatus } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { BankAccount } from '../bank-accounts/entities/bank-account.entity';

@Injectable()
export class FinanceService {
    constructor(
        @InjectRepository(Transaction)
        private txRepo: Repository<Transaction>,
    ) {}

    async create(dto: CreateTransactionDto, manager?: EntityManager): Promise<Transaction> {
        const repo = manager ? manager.getRepository(Transaction) : this.txRepo;
        const tx = repo.create({
            ...dto,
            status: dto.status || (dto.dueDate ? TransactionStatus.PENDING : TransactionStatus.PAID),
            competenceDate: dto.competenceDate || dto.paidDate || new Date().toISOString().slice(0, 10),
        });
        const saved = await repo.save(tx);

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

    async update(id: string, dto: Partial<CreateTransactionDto>): Promise<Transaction> {
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
    }): Promise<Transaction[]> {
        const qb = this.txRepo.createQueryBuilder('tx').orderBy('tx.createdAt', 'DESC');

        if (filters?.from)     qb.andWhere('tx.createdAt >= :from', { from: filters.from + 'T00:00:00' });
        if (filters?.to)       qb.andWhere('tx.createdAt <= :to',   { to:   filters.to   + 'T23:59:59' });
        if (filters?.type)     qb.andWhere('tx.type = :type',       { type: filters.type.toUpperCase() });
        if (filters?.status)   qb.andWhere('tx.status = :status',   { status: filters.status });
        if (filters?.category) qb.andWhere('tx.category = :cat',    { cat: filters.category });
        if (filters?.search)   qb.andWhere('(tx.description LIKE :q OR tx.supplier LIKE :q OR tx.documentNumber LIKE :q)', { q: `%${filters.search}%` });

        return qb.getMany();
    }

    async findByOrder(orderId: string): Promise<Transaction[]> {
        return this.txRepo.find({ where: { orderId }, order: { createdAt: 'DESC' } });
    }

    // ── Summary do período ──────────────────────────────────────
    async getSummary(from?: string, to?: string) {
        const all = await this.findAll({ from, to });
        const paid = all.filter(t => t.status === TransactionStatus.PAID);

        const totalIncome  = paid.filter(t => t.type === TransactionType.INCOME) .reduce((s, t) => s + Number(t.amount), 0);
        const totalExpense = paid.filter(t => t.type === TransactionType.EXPENSE).reduce((s, t) => s + Number(t.amount), 0);
        const pending      = all.filter(t => t.status === TransactionStatus.PENDING);
        const overdue      = all.filter(t => t.status === TransactionStatus.OVERDUE || (t.status === TransactionStatus.PENDING && t.dueDate && t.dueDate < new Date().toISOString().slice(0, 10)));

        const aReceber = pending.filter(t => t.type === TransactionType.INCOME) .reduce((s, t) => s + Number(t.amount), 0);
        const aPagar   = pending.filter(t => t.type === TransactionType.EXPENSE).reduce((s, t) => s + Number(t.amount), 0);
        const vencidos = overdue.reduce((s, t) => s + Number(t.amount), 0);

        return { totalIncome, totalExpense, balance: totalIncome - totalExpense, aReceber, aPagar, vencidos, totalTransactions: all.length };
    }

    // ── DRE por mês ────────────────────────────────────────────
    async getDre(year: number) {
        const all = await this.txRepo.find({
            where: [
                { createdAt: Between(new Date(`${year}-01-01`), new Date(`${year}-12-31`)) },
            ],
        });
        const months = Array.from({ length: 12 }, (_, i) => {
            const m = String(i + 1).padStart(2, '0');
            const txMonth = all.filter(t => {
                const d = t.competenceDate || t.createdAt.toISOString?.()?.slice(0, 7) || '';
                return d.startsWith(`${year}-${m}`);
            });
            const income  = txMonth.filter(t => t.type === TransactionType.INCOME  && t.status === TransactionStatus.PAID).reduce((s, t) => s + Number(t.amount), 0);
            const expense = txMonth.filter(t => t.type === TransactionType.EXPENSE && t.status === TransactionStatus.PAID).reduce((s, t) => s + Number(t.amount), 0);
            return { month: `${year}-${m}`, income, expense, profit: income - expense, margin: income > 0 ? ((income - expense) / income) * 100 : 0 };
        });
        return months;
    }

    // ── Contas a pagar / receber vencendo ─────────────────────
    async getUpcoming(days = 30) {
        const today = new Date().toISOString().slice(0, 10);
        const limit = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
        return this.txRepo.find({
            where: [
                { status: TransactionStatus.PENDING },
                { status: TransactionStatus.OVERDUE },
            ],
            order: { dueDate: 'ASC' },
        }).then(txs => txs.filter(t => !t.dueDate || t.dueDate <= limit));
    }

    // ── Fluxo de caixa (próximos 30 dias) ─────────────────────
    async getCashFlow(days = 30) {
        const today = new Date();
        const result: { date: string; income: number; expense: number; balance: number }[] = [];
        let runningBalance = 0;

        // Saldo atual (todas as transações pagas até hoje)
        const paid = await this.txRepo.find({ where: { status: TransactionStatus.PAID } });
        runningBalance = paid.reduce((s, t) =>
            s + (t.type === TransactionType.INCOME ? +Number(t.amount) : -Number(t.amount)), 0);

        for (let i = 0; i < days; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() + i);
            const dateStr = d.toISOString().slice(0, 10);

            const dayTxs = await this.txRepo.find({ where: { dueDate: dateStr, status: TransactionStatus.PENDING } });
            const income  = dayTxs.filter(t => t.type === TransactionType.INCOME) .reduce((s, t) => s + Number(t.amount), 0);
            const expense = dayTxs.filter(t => t.type === TransactionType.EXPENSE).reduce((s, t) => s + Number(t.amount), 0);
            runningBalance += income - expense;
            if (income > 0 || expense > 0) {
                result.push({ date: dateStr, income, expense, balance: runningBalance });
            }
        }
        return result;
    }

    // ── Por categoria ──────────────────────────────────────────
    async getByCategory(from?: string, to?: string) {
        const all = await this.findAll({ from, to });
        const map: Record<string, { income: number; expense: number }> = {};
        for (const tx of all.filter(t => t.status === TransactionStatus.PAID)) {
            if (!map[tx.category]) map[tx.category] = { income: 0, expense: 0 };
            if (tx.type === TransactionType.INCOME)  map[tx.category].income  += Number(tx.amount);
            if (tx.type === TransactionType.EXPENSE) map[tx.category].expense += Number(tx.amount);
        }
        return Object.entries(map).map(([category, vals]) => ({ category, ...vals }))
            .sort((a, b) => (b.income + b.expense) - (a.income + a.expense));
    }
}
