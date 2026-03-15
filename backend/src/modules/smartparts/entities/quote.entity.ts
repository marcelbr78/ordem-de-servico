import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Supplier } from './supplier.entity';
import { OrderService } from '../../orders/entities/order-service.entity';

export enum QuoteStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
    EXPIRED = 'EXPIRED',
}

@Entity('smartparts_quotes')
export class Quote {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    orderId: string;

    @Exclude()
    @ManyToOne(() => OrderService, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'orderId' })
    order: OrderService;

    @Column()
    productName: string;

    @Column({
        type: 'text',
        enum: QuoteStatus,
        default: QuoteStatus.PENDING,
    })
    status: QuoteStatus;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    bestPrice: number;

    @Column({ nullable: true })
    winnerId: string;

    @ManyToOne(() => Supplier, { nullable: true })
    @JoinColumn({ name: 'winnerId' })
    winner: Supplier;

    @Column()
    expiresAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
