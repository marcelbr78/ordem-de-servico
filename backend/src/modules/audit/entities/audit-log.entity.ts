import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('audit_logs')
export class AuditLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    @Index()
    userId: string;

    @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    @Index()
    action: string; // LOGIN, LOGOUT, FAIL_LOGIN, CREATE_USER, etc

    @Column()
    @Index()
    entity: string; // User, Order, etc

    @Column({ nullable: true })
    entityId: string;

    @Column({ type: 'text', nullable: true })
    details: string;

    @Column({ nullable: true })
    ip: string;

    @Column({ nullable: true })
    userAgent: string;

    @CreateDateColumn()
    @Index()
    createdAt: Date;
}
