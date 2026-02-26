import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Transaction, TransactionType } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { BankAccount } from '../bank-accounts/entities/bank-account.entity';

@Injectable()
export class FinanceService {
    constructor(
        @InjectRepository(Transaction)
        private transactionRepository: Repository<Transaction>,
    ) { }

    async create(createDto: CreateTransactionDto, manager?: EntityManager): Promise<Transaction> {
        const repo = manager ? manager.getRepository(Transaction) : this.transactionRepository;
        const transaction = repo.create(createDto);
        const saved = await repo.save(transaction);

        // Update bank account balance if provided
        if (createDto.bankAccountId) {
            const bankRepo = manager ? manager.getRepository(BankAccount) : undefined;
            if (bankRepo) {
                const account = await bankRepo.findOne({ where: { id: createDto.bankAccountId } });
                if (account) {
                    const amount = createDto.type === TransactionType.INCOME ? Number(createDto.amount) : -Number(createDto.amount);
                    account.currentBalance = Number(account.currentBalance) + amount;
                    await bankRepo.save(account);
                }
            }
        }

        return saved;
    }

    async findAll(): Promise<Transaction[]> {
        return this.transactionRepository.find({
            order: { createdAt: 'DESC' },
        });
    }

    async getSummary() {
        const transactions = await this.transactionRepository.find();

        const income = transactions
            .filter(t => t.type === TransactionType.INCOME)
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const expense = transactions
            .filter(t => t.type === TransactionType.EXPENSE)
            .reduce((sum, t) => sum + Number(t.amount), 0);

        return {
            totalIncome: income,
            totalExpense: expense,
            balance: income - expense,
        };
    }

    async findByOrder(orderId: string): Promise<Transaction[]> {
        return this.transactionRepository.find({ where: { orderId } });
    }
}
