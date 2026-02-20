import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { OrderService } from './order-service.entity';
import { User } from '../../users/entities/user.entity';

export enum HistoryActionType {
    STATUS_CHANGE = 'STATUS_CHANGE',
    COMMENT = 'COMMENT',
    SYSTEM = 'SYSTEM',
    PHOTO = 'PHOTO',
    INTEGRATION = 'INTEGRATION',
}

@Entity('order_history')
export class OrderHistory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    orderId: string;

    @ManyToOne(() => OrderService, order => order.history, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'orderId' })
    order: OrderService;

    @Column({ nullable: true })
    previousStatus: string;

    @Column({ nullable: true })
    newStatus: string;

    @Column({
        type: 'text', // SQLite uses text for enums usually, or simple varchar
        default: HistoryActionType.SYSTEM
    })
    actionType: HistoryActionType;

    @Column({ type: 'text', nullable: true })
    comments: string;

    @Column({ default: false })
    waMsgSent: boolean;

    @Column({ type: 'text', nullable: true })
    waMsgContent: string;

    @Column({ nullable: true })
    userId: string;

    @ManyToOne(() => User, user => user.id, { nullable: true })
    @JoinColumn({ name: 'userId' })
    user: User;

    @CreateDateColumn()
    createdAt: Date;

    // Sem UpdateDateColumn para garantir imutabilidade
}
