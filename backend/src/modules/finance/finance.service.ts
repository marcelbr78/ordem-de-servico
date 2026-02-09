import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionType } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class FinanceService {
    constructor(
        @InjectRepository(Transaction)
        private transactionRepository: Repository<Transaction>,
    ) { }

    async create(createDto: CreateTransactionDto): Promise<Transaction> {
        const transaction = this.transactionRepository.create(createDto);
        return this.transactionRepository.save(transaction);
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
