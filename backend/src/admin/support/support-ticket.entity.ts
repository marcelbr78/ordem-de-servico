import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Tenant } from '../../modules/tenants/entities/tenant.entity';

export enum TicketStatus {
    OPEN        = 'open',
    IN_PROGRESS = 'in_progress',
    WAITING     = 'waiting',
    RESOLVED    = 'resolved',
    CLOSED      = 'closed',
}
export enum TicketPriority {
    LOW      = 'low',
    MEDIUM   = 'medium',
    HIGH     = 'high',
    CRITICAL = 'critical',
}
export enum TicketCategory {
    BILLING     = 'billing',
    TECHNICAL   = 'technical',
    FEATURE     = 'feature',
    BUG         = 'bug',
    ONBOARDING  = 'onboarding',
    OTHER       = 'other',
}

@Entity('support_tickets')
export class SupportTicket {
    @PrimaryGeneratedColumn('uuid') id: string;
    @Column({ nullable: true }) tenantId: string;
    @ManyToOne(() => Tenant, { nullable: true, eager: false }) @JoinColumn({ name: 'tenantId' }) tenant: Tenant;
    @Column({ nullable: true }) userId: string;
    @Column() title: string;
    @Column({ type: 'text' }) description: string;
    @Column({ type: 'text', default: TicketStatus.OPEN }) status: TicketStatus;
    @Column({ type: 'text', default: TicketPriority.MEDIUM }) priority: TicketPriority;
    @Column({ type: 'text', default: TicketCategory.OTHER }) category: TicketCategory;
    @Column({ nullable: true }) assignedToName: string;
    @Column({ nullable: true }) resolvedAt: Date;
    @OneToMany(() => TicketMessage, m => m.ticket, { cascade: true }) messages: TicketMessage[];
    @CreateDateColumn() createdAt: Date;
    @UpdateDateColumn() updatedAt: Date;
}

@Entity('support_ticket_messages')
export class TicketMessage {
    @PrimaryGeneratedColumn('uuid') id: string;
    @Column() ticketId: string;
    @ManyToOne(() => SupportTicket, t => t.messages, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'ticketId' }) ticket: SupportTicket;
    @Column({ type: 'text' }) content: string;
    @Column({ default: false }) isStaff: boolean;
    @Column({ nullable: true }) authorName: string;
    @Column({ nullable: true }) authorId: string;
    @CreateDateColumn() createdAt: Date;
}
