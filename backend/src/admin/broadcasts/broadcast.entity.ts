import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum BroadcastStatus { DRAFT='draft', SENT='sent', SCHEDULED='scheduled' }
export enum BroadcastTarget { ALL='all', TRIAL='trial', ACTIVE='active', PAST_DUE='past_due', SUSPENDED='suspended', CUSTOM='custom' }
export enum BroadcastChannel { IN_APP='in_app', EMAIL='email', WHATSAPP='whatsapp' }

@Entity('admin_broadcasts')
export class Broadcast {
    @PrimaryGeneratedColumn('uuid') id: string;
    @Column() title: string;
    @Column({ type: 'text' }) body: string;
    @Column({ type: 'text', default: BroadcastChannel.IN_APP }) channel: BroadcastChannel;
    @Column({ type: 'text', default: BroadcastTarget.ALL }) target: BroadcastTarget;
    @Column({ type: 'text', default: BroadcastStatus.DRAFT }) status: BroadcastStatus;
    @Column({ type: 'int', default: 0 }) recipientCount: number;
    @Column({ nullable: true }) scheduledAt: Date;
    @Column({ nullable: true }) sentAt: Date;
    @CreateDateColumn() createdAt: Date;
}
