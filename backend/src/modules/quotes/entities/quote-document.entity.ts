import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { OrderService } from '../../orders/entities/order-service.entity';

export enum QuoteDocStatus {
    DRAFT = 'draft', SENT = 'sent', APPROVED = 'approved',
    REJECTED = 'rejected', EXPIRED = 'expired', CANCELED = 'canceled',
}

@Entity('quote_documents')
export class QuoteDocument {
    @PrimaryGeneratedColumn('uuid') id: string;
    @Column({ nullable: true }) tenantId: string;
    @Column() orderId: string;
    @Column({ default: 1 }) version: number;
    @Column({ type: 'text', default: QuoteDocStatus.DRAFT }) status: QuoteDocStatus;
    @Column({ nullable: true }) validUntil: string;
    @Column({ type: 'text' }) itemsJson: string;
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 }) subtotal: number;
    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 }) discountPercent: number;
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 }) discountValue: number;
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 }) total: number;
    @Column({ nullable: true }) paymentCondition: string;
    @Column({ nullable: true }) deliveryDays: number;
    @Column({ nullable: true }) warrantyDays: number;
    @Column({ nullable: true }) notes: string;
    @Column({ nullable: true }) approvedAt: Date;
    @Column({ nullable: true }) approvedByName: string;
    @Column({ nullable: true }) rejectedAt: Date;
    @Column({ nullable: true }) rejectionReason: string;
    @Column({ nullable: true }) sentAt: Date;
    @Column({ nullable: true }) sentByUserId: string;
    @CreateDateColumn() createdAt: Date;
    @UpdateDateColumn() updatedAt: Date;
}
