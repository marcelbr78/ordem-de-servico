import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('audit_logs')
export class AuditLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    userId: string;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    action: string; // e.g. 'CREATE', 'UPDATE', 'DELETE', 'LOGIN'

    @Column()
    resource: string; // e.g. 'Order', 'Client', 'Product'

    @Column({ nullable: true })
    resourceId: string;

    @Column('text', { nullable: true })
    details: string; // JSON string of changes or details

    @Column({ nullable: true })
    ipAddress: string;

    @CreateDateColumn()
    createdAt: Date;
}
