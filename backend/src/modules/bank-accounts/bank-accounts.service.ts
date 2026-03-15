import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankAccount } from './entities/bank-account.entity';

// Helper: sanitise incoming raw body (front-end sends empty strings for unfilled optional fields)
function sanitise(raw: Record<string, unknown>): Partial<BankAccount> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(raw)) {
        if (typeof value === 'string') {
            const trimmed = value.trim();
            result[key] = trimmed === '' ? undefined : trimmed;
        } else {
            result[key] = value;
        }
    }
    // Coerce numeric fields
    if (raw.initialBalance !== undefined) {
        result.initialBalance = parseFloat(String(raw.initialBalance)) || 0;
    }
    // Coerce boolean fields
    if (typeof raw.isActive === 'string') {
        result.isActive = raw.isActive === 'true';
    }
    return result as Partial<BankAccount>;
}

@Injectable()
export class BankAccountsService {
    constructor(
        @InjectRepository(BankAccount)
        private bankAccountRepository: Repository<BankAccount>,
    ) { }

    async createFromRaw(raw: Record<string, unknown>): Promise<BankAccount> {
        const data = sanitise(raw);
        const account = Object.assign(new BankAccount(), {
            ...data,
            currentBalance: (data.initialBalance as number) ?? 0,
        });
        return this.bankAccountRepository.save(account);
    }

    async updateFromRaw(id: string, raw: Record<string, unknown>): Promise<BankAccount> {
        const account = await this.findOne(id);
        const data = sanitise(raw);
        Object.assign(account, data);
        return this.bankAccountRepository.save(account);
    }

    async findAll(): Promise<BankAccount[]> {
        return this.bankAccountRepository.find({
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string): Promise<BankAccount> {
        const account = await this.bankAccountRepository.findOne({ where: { id } });
        if (!account) {
            throw new NotFoundException('Conta bancária não encontrada');
        }
        return account;
    }

    async remove(id: string): Promise<void> {
        await this.findOne(id);
        await this.bankAccountRepository.delete(id);
    }

    async updateBalance(id: string, amount: number): Promise<BankAccount> {
        const account = await this.findOne(id);
        account.currentBalance = Number(account.currentBalance) + amount;
        return this.bankAccountRepository.save(account);
    }

    async getTotalBalance(): Promise<{ total: number; accounts: BankAccount[] }> {
        const accounts = await this.findAll();
        const total = accounts.reduce((sum, acc) => sum + Number(acc.currentBalance), 0);
        return { total, accounts };
    }
}
