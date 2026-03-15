import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum AppointmentStatus {
    SCHEDULED = 'scheduled',
    CONFIRMED = 'confirmed',
    IN_PROGRESS = 'in_progress',
    DONE = 'done',
    CANCELLED = 'cancelled',
}

@Entity('appointments')
export class Appointment {
    @PrimaryGeneratedColumn('uuid') id: string;
    @Column({ nullable: true }) tenantId: string;
    @Column({ nullable: true }) technicianId: string;
    @Column({ nullable: true }) clientId: string;
    @Column({ nullable: true }) orderId: string;
    @Column() title: string;
    @Column({ nullable: true }) description: string;
    @Column({ type: 'varchar', default: AppointmentStatus.SCHEDULED }) status: AppointmentStatus;
    @Column({ type: 'timestamp' }) startAt: Date;
    @Column({ type: 'timestamp' }) endAt: Date;
    @Column({ nullable: true }) color: string;
    @Column({ type: 'boolean', default: false }) allDay: boolean;
    @Column({ nullable: true }) notes: string;
    @CreateDateColumn() createdAt: Date;
    @UpdateDateColumn() updatedAt: Date;
}
