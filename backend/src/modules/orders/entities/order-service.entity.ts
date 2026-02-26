import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn
} from 'typeorm';
import { Client } from '../../clients/entities/client.entity';
import { OrderEquipment } from './order-equipment.entity';
import { OrderHistory } from './order-history.entity';

import { OrderPhoto } from './order-photo.entity';
import { Quote } from '../../smartparts/entities/quote.entity';
import { OrderPart } from './order-part.entity';

export enum OSStatus {
    ABERTA = 'aberta',
    EM_DIAGNOSTICO = 'em_diagnostico',
    AGUARDANDO_APROVACAO = 'aguardando_aprovacao',
    AGUARDANDO_PECA = 'aguardando_peca',
    EM_REPARO = 'em_reparo',
    TESTES = 'testes',
    FINALIZADA = 'finalizada',
    ENTREGUE = 'entregue',
    CANCELADA = 'cancelada',
}

export enum OSPriority {
    BAIXA = 'baixa',
    NORMAL = 'normal',
    ALTA = 'alta',
    URGENTE = 'urgente',
}

@Entity('order_services')
export class OrderService {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    protocol: string; // Ex: 202402-0001

    @Column({
        type: 'text',
        default: OSStatus.ABERTA,
    })
    status: OSStatus;

    @Column({
        type: 'text',
        default: OSPriority.NORMAL,
    })
    priority: OSPriority;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    estimatedValue: number;

    // Valor pago/final (pode ser soma de serviços + peças)
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    finalValue: number;

    @Column({ type: 'text', nullable: true })
    reportedDefect: string;

    @Column({ type: 'text', nullable: true })
    diagnosis: string;

    @Column({ type: 'text', nullable: true })
    technicalReport: string;


    @ManyToOne(() => Client, { eager: true })
    @JoinColumn({ name: 'clientId' })
    client: Client;

    @Column()
    clientId: string;

    @Column({ nullable: false }) // Obrigatório conforme regra de negócio
    technicianId: string;

    @OneToMany(() => OrderEquipment, equipment => equipment.order, { cascade: true })
    equipments: OrderEquipment[];

    @OneToMany(() => OrderHistory, history => history.order, { cascade: true })
    history: OrderHistory[];

    @OneToMany(() => OrderPhoto, photo => photo.order, { cascade: true })
    photos: OrderPhoto[];

    @OneToMany(() => Quote, quote => quote.order, { cascade: true })
    quotes: Quote[];

    @OneToMany(() => OrderPart, part => part.order, { cascade: true })
    parts: OrderPart[];

    @CreateDateColumn()
    entryDate: Date;

    @Column({ nullable: true })
    exitDate: Date; // Preenchido apenas se ENTREGUE/CANCELADA

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}
