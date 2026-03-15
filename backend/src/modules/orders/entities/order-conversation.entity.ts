import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { OrderService } from './order-service.entity';

export enum MessageDirection {
    OUTBOUND = 'outbound', // loja → cliente
    INBOUND  = 'inbound',  // cliente → loja
}

export enum MessageChannel {
    WHATSAPP = 'whatsapp',
    EMAIL    = 'email',
    SYSTEM   = 'system', // mensagem automática do sistema
}

@Entity('order_conversations')
export class OrderConversation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    @Index()
    tenantId: string;

    @Column()
    orderId: string;

    @ManyToOne(() => OrderService, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'orderId' })
    order: OrderService;

    @Column({ type: 'text', default: MessageDirection.OUTBOUND })
    direction: MessageDirection;

    @Column({ type: 'text', default: MessageChannel.WHATSAPP })
    channel: MessageChannel;

    @Column({ type: 'text' })
    content: string;

    // Quem enviou: nome do técnico/atendente OU número do cliente
    @Column({ nullable: true })
    senderName: string;

    @Column({ nullable: true })
    senderPhone: string;

    // Referência ao usuário interno que enviou (quando outbound)
    @Column({ nullable: true })
    userId: string;

    // Status de entrega (para outbound)
    @Column({ type: 'boolean', default: false })
    delivered: boolean;

    // Lido pelo cliente (quando possível detectar)
    @Column({ type: 'boolean', default: false })
    read: boolean;

    // Metadados extras (ex: ID da mensagem no WhatsApp para correlação)
    @Column({ type: 'text', nullable: true })
    externalId: string;

    @CreateDateColumn()
    createdAt: Date;
}
