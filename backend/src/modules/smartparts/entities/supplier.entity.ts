import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum SupplierCategory {
    PARTS = 'parts',        // Peças
    SERVICES = 'services',  // Serviços (ex: manutenção terceirizada)
    BOTH = 'both',
}

@Entity('smartparts_suppliers')
export class Supplier {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    tenantId: string;

    @Column()
    name: string;

    @Column()
    phone: string; // WhatsApp number

    @Column({ nullable: true })
    contactPerson: string; // Nome do contato

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    cnpj: string;

    @Column({ nullable: true })
    address: string;

    @Column({ nullable: true })
    city: string;

    @Column({ nullable: true })
    state: string;

    @Column({ type: 'text', default: SupplierCategory.PARTS })
    category: SupplierCategory;

    @Column({ type: 'text', nullable: true })
    brands: string; // JSON array: ["Samsung","Apple","Motorola"]

    @Column({ type: 'text', nullable: true })
    paymentTerms: string; // Ex: "30 dias", "à vista com 5% desconto"

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ default: true })
    active: boolean;

    @Column({ type: 'int', default: 5 })
    reliability: number; // 1-5 — calculado automaticamente

    @Column({ type: 'int', default: 3 })
    deliveryDays: number;

    // Métricas calculadas automaticamente
    @Column({ type: 'int', default: 0 })
    totalQuotes: number; // Quantas cotações recebidas

    @Column({ type: 'int', default: 0 })
    totalWins: number; // Quantas cotações venceu

    @Column({ type: 'int', default: 0 })
    totalOrders: number; // Quantas compras efetivadas

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    totalSpent: number; // Total gasto com este fornecedor

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    responseRatePercent: number; // % de cotações que respondeu

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
