import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum CommissionStatus {
    PENDING  = 'pending',
    PAID     = 'paid',
    CANCELED = 'canceled',
}

export enum CommissionBasis {
    SERVICE_VALUE = 'service_value',
    PARTS_VALUE   = 'parts_value',
    TOTAL_VALUE   = 'total_value',
    FIXED         = 'fixed',
}

@Entity('commissions')
export class Commission {
    @PrimaryGeneratedColumn('uuid') id: string;
    @Column({ nullable: true }) tenantId: string;
    @Column() technicianId: string;
    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'technicianId' })
    technician: User;
    @Column() orderId: string;
    @Column({ nullable: true }) orderProtocol: string;
    @Column({ type: 'decimal', precision: 10, scale: 2 }) baseValue: number;
    @Column({ type: 'decimal', precision: 5,  scale: 2 }) ratePercent: number;
    @Column({ type: 'decimal', precision: 10, scale: 2 }) commissionValue: number;
    @Column({ type: 'text', default: CommissionBasis.SERVICE_VALUE }) basis: CommissionBasis;
    @Column({ type: 'text', default: CommissionStatus.PENDING }) status: CommissionStatus;
    @Column({ nullable: true }) paymentPeriod: string;
    @Column({ nullable: true }) paidAt: Date;
    @Column({ nullable: true }) notes: string;
    @CreateDateColumn() createdAt: Date;
    @UpdateDateColumn() updatedAt: Date;
}
