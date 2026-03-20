import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { ManyToOne, JoinColumn } from 'typeorm';


export enum UserRole {
    ADMIN = 'admin',
    TECHNICIAN = 'technician',
    ATTENDANT = 'attendant',
    SUPER_ADMIN = 'super_admin',
}

@Entity('users')
@Index(['tenantId', 'email'], { unique: true, where: '"tenantId" IS NOT NULL' })
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    @Index()
    tenantId: string;

    @ManyToOne(() => Tenant, { nullable: true })
    @JoinColumn({ name: 'tenantId' })
    tenant: Tenant;

    @Column()
    email: string;

    @Exclude()
    @Column()
    password: string;

    @Column()
    name: string;

    @Column({
        type: 'text',
        default: UserRole.ATTENDANT,
    })
    role: UserRole;

    @Column({ default: true })
    @Index()
    isActive: boolean;

    @Column({ default: true })
    canViewFinancials: boolean;

    @Column({ nullable: true })
    @Index()
    refreshTokenHash: string;

    @Column({ nullable: true })
    lastLogin: Date;

    @Column({ default: false })
    mustChangePassword: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
