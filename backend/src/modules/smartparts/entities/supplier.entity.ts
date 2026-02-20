import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('smartparts_suppliers')
export class Supplier {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    phone: string; // WhatsApp number

    @Column({ default: true })
    active: boolean;

    @Column({ type: 'int', default: 5 })
    reliability: number; // 1-5

    @Column({ type: 'int', default: 3 })
    deliveryDays: number; // Prazo médio em dias

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
