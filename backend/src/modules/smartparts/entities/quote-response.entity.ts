import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Quote } from './quote.entity';
import { Supplier } from './supplier.entity';

export enum ResponseType {
    SINGLE = 'single',       // Preço único
    MULTIPLE = 'multiple',   // Múltiplas opções (Incell/OLED/Original)
    NO_STOCK = 'no_stock',   // Sem estoque
    GREETING = 'greeting',   // Apenas cumprimentou
}

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
    price: number; // Menor preço ou único preço

    @Column({ type: 'text' })
    message: string; // Mensagem original

    @Column({ type: 'text', default: ResponseType.SINGLE })
    responseType: ResponseType;

    // Opções múltiplas parseadas — JSON: [{label, price, quality}]
    // Ex: [{"label":"Incell","price":80},{"label":"OLED China","price":150},{"label":"Original","price":280}]
    @Column({ type: 'text', nullable: true })
    parsedOptions: string;

    @Column({ nullable: true })
    deliveryDays: number; // Prazo informado pelo fornecedor

    @CreateDateColumn()
    receivedAt: Date;
}
