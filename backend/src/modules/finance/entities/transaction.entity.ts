import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { OrderService } from '../../orders/entities/order-service.entity';

export enum TransactionType {
    INCOME = 'INCOME',
    EXPENSE = 'EXPENSE',
}

@Entity('transactions')
export class Transaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'text',
    })
    type: TransactionType;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column()
    paymentMethod: string; // PIX, Cash, Credit Card, Debit Card

    @Column()
    category: string; // OS Payment, Parts Purchase, Rent, Utilities, Others

    @Column({ nullable: true })
    description: string;

    @ManyToOne(() => OrderService, { nullable: true })
    @JoinColumn({ name: 'orderId' })
    order: OrderService;

    @Column({ nullable: true })
    orderId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
