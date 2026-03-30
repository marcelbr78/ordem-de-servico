import {
    Entity, PrimaryGeneratedColumn, Column, Index,
    CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export enum RefundStatus {
    REQUESTED = 'solicitado',
    APPROVED  = 'aprovado',
    DENIED    = 'negado',
    EXECUTED  = 'executado',
}

export enum RefundType {
    FINANCIAL = 'financeiro',
    SERVICE   = 'servico',
}

@Entity('warranty_refunds')
@Index(['tenantId', 'originalOrderId'])
export class WarrantyRefund {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    tenantId: string;

    // OS original
    @Column()
    originalOrderId: string;

    @Column({ nullable: true })
    originalProtocol: string;

    // Retorno de garantia vinculado (opcional — pode ser estorno direto)
    @Column({ nullable: true })
    warrantyReturnId: string;

    // Usuários
    @Column()
    requestedById: string;

    @Column({ nullable: true })
    requestedByName: string;

    @Column({ nullable: true })
    authorizedById: string;

    @Column({ nullable: true })
    authorizedByName: string;

    // Status e tipo
    @Column({ type: 'varchar', default: RefundStatus.REQUESTED })
    status: RefundStatus;

    @Column({ type: 'varchar', default: RefundType.FINANCIAL })
    type: RefundType;

    // Valor (para estorno financeiro)
    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    amount: number;

    // Motivos e observações
    @Column({ type: 'text' })
    reason: string;

    @Column({ type: 'text', nullable: true })
    adminNotes: string;

    @Column({ nullable: true })
    executedAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
