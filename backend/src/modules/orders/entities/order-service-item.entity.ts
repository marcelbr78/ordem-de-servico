import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { OrderService } from './order-service.entity';

@Entity('order_service_items')
export class OrderServiceItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    @Index()
    tenantId: string;

    @Column()
    @Index()
    orderId: string;

    @ManyToOne(() => OrderService, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'orderId' })
    order: OrderService;

    @Column()
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    price: number;

    @Column({ nullable: true })
    catalogId: string; // ref. ao catálogo original (opcional)

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
