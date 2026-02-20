import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Quote } from './quote.entity';
import { Supplier } from './supplier.entity';

@Entity('smartparts_quote_responses')
export class QuoteResponse {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    quoteId: string;

    @ManyToOne(() => Quote, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'quoteId' })
    quote: Quote;

    @Column()
    supplierId: string;

    @ManyToOne(() => Supplier, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'supplierId' })
    supplier: Supplier;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price: number;

    @Column({ type: 'text' })
    message: string;

    @CreateDateColumn()
    receivedAt: Date;
}
