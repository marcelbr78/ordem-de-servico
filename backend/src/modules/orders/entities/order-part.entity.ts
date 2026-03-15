import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { OrderService } from './order-service.entity';
import { Product } from '../../inventory/entities/product.entity';

@Entity('order_parts')
export class OrderPart {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    orderId: string;

    @ManyToOne(() => OrderService, order => order.parts, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'orderId' })
    order: OrderService;

    @Column()
    productId: string;

    @ManyToOne(() => Product)
    @JoinColumn({ name: 'productId' })
    product: Product;

    @Column({ type: 'int' })
    quantity: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    unitPrice: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    unitCost: number;
}
