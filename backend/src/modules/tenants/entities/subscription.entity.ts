import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Plan } from './plan.entity';

export enum SubscriptionStatus {
    ACTIVE    = 'active',
    TRIAL     = 'trial',
    PAST_DUE  = 'past_due',
    CANCELLED = 'cancelled',
    SUSPENDED = 'suspended',
}

@Entity('subscriptions')
export class Subscription {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    tenantId: string;

    @Column({ nullable: true })
    planId: string;

    @ManyToOne(() => Plan, { nullable: true, eager: true })
    @JoinColumn({ name: 'planId' })
    plan: Plan;

    @Column({ type: 'varchar', default: SubscriptionStatus.TRIAL })
    status: SubscriptionStatus;

    @Column({ nullable: true })
    nextBilling: Date;

    @Column({ nullable: true })
    trialEndsAt: Date;

    @Column({ nullable: true })
    cancelledAt: Date;

    @Column({ nullable: true })
    externalId: string; // ID no gateway de pagamento (PagBank)

    @Column({ nullable: true })
    paymentMethod: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
