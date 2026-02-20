import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne } from 'typeorm';
import { StockBalance } from './stock-balance.entity';

@Entity('products')
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    description: string;

    @Column({ unique: true, nullable: true })
    sku: string;

    @Column({ unique: true, nullable: true })
    barcode: string;

    @Column({ nullable: true })
    brand: string;

    @Column({ nullable: true })
    category: string;

    @Column({ default: 'UN' })
    unit: string; // UN, PÇ, CX, KG, MT, LT

    @Column({ nullable: true })
    ncm: string; // Nomenclatura Comum do Mercosul

    @Column({ nullable: true })
    cfop: string; // Código Fiscal de Operações

    @Column({ nullable: true })
    origin: string; // 0=Nacional, 1=Estrangeira importação direta, 2=Estrangeira adquirida no mercado interno

    @Column({ nullable: true })
    supplierId: string; // Fornecedor principal (referência a smartparts_suppliers)

    @Column({ type: 'int', default: 0 })
    minQuantity: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    priceCost: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    priceSell: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToOne(() => StockBalance, (balance) => balance.product)
    balance: StockBalance;
}
