import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { OrderService } from './order-service.entity';

@Entity('order_equipments')
export class OrderEquipment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    orderId: string;

    @ManyToOne(() => OrderService, order => order.equipments, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'orderId' })
    order: OrderService;

    @Column({ default: false })
    isMain: boolean;

    @Column()
    type: string; // Celular, Notebook, etc.

    @Column()
    brand: string;

    @Column()
    model: string;

    @Column({ nullable: true })
    serialNumber: string;

    @Column({ type: 'text' })
    reportedDefect: string;

    @Column({ type: 'text', nullable: true })
    accessories: string;

    @Column({ type: 'text', nullable: true })
    condition: string;

    @Column({ type: 'text', nullable: true })
    functionalChecklist: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
