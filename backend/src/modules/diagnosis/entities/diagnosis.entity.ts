import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { OrderService } from '../../orders/entities/order-service.entity';

@Entity('diagnoses')
export class Diagnosis {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => OrderService)
    @JoinColumn({ name: 'orderId' })
    order: OrderService;

    @Column()
    orderId: string;

    @Column({ type: 'simple-json', nullable: true })
    checklistEntry: any; // Itens de conferência na entrada

    @Column({ type: 'text' })
    technicalReport: string; // Laudo técnico detalhado

    @Column({ type: 'simple-json', nullable: true })
    partsNeeded: any; // Lista de peças: [{name, price, quantity}]

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    laborValue: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    totalValue: number;

    @Column({ default: 'pending' }) // pending, approved, rejected
    approvalStatus: string;

    @Column({ nullable: true })
    approvedAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
