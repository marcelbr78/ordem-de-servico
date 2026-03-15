import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('suppliers_registry')
export class Supplier {
    @PrimaryGeneratedColumn('uuid') id: string;
    @Column({ nullable: true }) tenantId: string;
    @Column() name: string;
    @Column({ nullable: true }) cnpj: string;
    @Column({ nullable: true }) email: string;
    @Column({ nullable: true }) phone: string;
    @Column({ nullable: true }) contactName: string;
    @Column({ nullable: true }) address: string;
    @Column({ nullable: true }) city: string;
    @Column({ nullable: true }) state: string;
    @Column({ nullable: true }) notes: string;
    @Column({ type: 'boolean', default: true }) isActive: boolean;
    @Column({ nullable: true }) category: string;
    @Column({ type: 'int', default: 30 }) paymentTermDays: number;
    @CreateDateColumn() createdAt: Date;
    @UpdateDateColumn() updatedAt: Date;
}
