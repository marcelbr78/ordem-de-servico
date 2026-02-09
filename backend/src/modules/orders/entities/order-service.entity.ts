import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Client } from '../../clients/entities/client.entity';

export enum OSStatus {
    FILA = 'fila',
    DIAGNOSTICO = 'diagnostico',
    AGUARDANDO_PECA = 'aguardando_peca',
    ORCAMENTO = 'orcamento',
    APROVADO = 'aprovado',
    RECUSADO = 'recusado',
    EM_REPARO = 'em_reparo',
    PRONTO = 'pronto',
    ENTREGUE = 'entregue',
    CANCELADO = 'cancelado',
}

@Entity('order_services')
export class OrderService {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    protocol: string; // Ex: 202402-0001

    @Column()
    equipment: string;

    @Column({ nullable: true })
    brandModel: string;

    @Column({ nullable: true })
    serialNumber: string;

    @Column({ type: 'text' })
    reportedProblem: string;

    @Column({ type: 'text', nullable: true })
    cosmeticCondition: string;

    @Column({ type: 'text', nullable: true })
    diagnosis: string;

    @Column({ type: 'text', nullable: true })
    solution: string;

    @Column({
        type: 'text',
        default: OSStatus.FILA,
    })
    status: OSStatus;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    estimatedValue: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    paidValue: number;

    @ManyToOne(() => Client, { eager: true })
    @JoinColumn({ name: 'clientId' })
    client: Client;

    @Column()
    clientId: string;

    @Column({ nullable: true })
    technicianId: string;

    @CreateDateColumn()
    entryDate: Date;

    @Column({ nullable: true })
    exitDate: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
