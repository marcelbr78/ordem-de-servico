import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Product } from './product.entity';
import { OrderService } from '../../orders/entities/order-service.entity';

export enum MovementType {
    ENTRY = 'ENTRY',
    EXIT = 'EXIT',
    REVERSE_ENTRY = 'REVERSE_ENTRY',
    REVERSE_EXIT = 'REVERSE_EXIT',
}

@Entity('inventory_stock_movements')
export class StockMovement {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    productId: string;

    @ManyToOne(() => Product)
    @JoinColumn({ name: 'productId' })
    product: Product;

    @Column({ nullable: true })
    orderId: string;

    @ManyToOne(() => OrderService, { nullable: true })
    @JoinColumn({ name: 'orderId' })
    order: OrderService;

    @Column({ type: 'text' }) // SQLite enum fix
    type: MovementType;

    @Column({ type: 'int' })
    quantity: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    unitCost: number;

    @Column({ type: 'int' })
    balanceBefore: number;

    @Column({ type: 'int' })
    balanceAfter: number;

    @CreateDateColumn()
    createdAt: Date;
}
