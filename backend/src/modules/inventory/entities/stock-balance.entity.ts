import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, UpdateDateColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity('inventory_stock_balances')
export class StockBalance {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    productId: string;

    @OneToOne(() => Product, (product) => product.balance)
    @JoinColumn({ name: 'productId' })
    product: Product;

    @Column({ type: 'int', default: 0 })
    quantity: number;

    @UpdateDateColumn()
    updatedAt: Date;
}
