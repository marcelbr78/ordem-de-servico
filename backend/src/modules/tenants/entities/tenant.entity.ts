import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum TenantStatus {
    ACTIVE    = 'active',
    TRIAL     = 'trial',
    SUSPENDED = 'suspended',
    PAST_DUE  = 'past_due',
    INACTIVE  = 'inactive',
}

@Entity('tenants')
export class Tenant {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    name: string;

    @Column({ nullable: true })
    storeName: string;

    @Column({ unique: true, nullable: true })
    subdomain: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ nullable: true })
    cnpj: string;

    @Column({ nullable: true })
    ownerName: string;

    @Column({ type: 'varchar', default: TenantStatus.TRIAL })
    status: TenantStatus;

    @Column({ nullable: true })
    logoUrl: string;

    @Column({ nullable: true })
    address: string;

    @Column({ nullable: true })
    city: string;

    @Column({ nullable: true })
    state: string;

    @Column({ nullable: true })
    zipCode: string;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
