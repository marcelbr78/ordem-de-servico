import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export enum NotaStatus {
    PENDENTE = 'pendente',
    AGUARDANDO = 'aguardando',
    AUTORIZADA = 'autorizada',
    REJEITADA = 'rejeitada',
    CANCELADA = 'cancelada',
}

export enum NotaTipo {
    PRODUTO = 'produto',
    SERVICO = 'servico',
}

@Entity('fiscal_notas')
export class FiscalNota {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 10, default: NotaTipo.PRODUTO })
    tipo: NotaTipo;

    @Column({ type: 'varchar', length: 20, default: NotaStatus.PENDENTE })
    status: NotaStatus;

    @Column({ type: 'text', nullable: true })
    xmlEnvio: string;

    @Column({ type: 'text', nullable: true })
    xmlRetorno: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    protocolo: string;

    @Column({ type: 'varchar', length: 44, nullable: true })
    chaveAcesso: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    recibo: string;

    @Column({ type: 'int', nullable: true })
    cStat: number;

    @Column({ type: 'text', nullable: true })
    xMotivo: string;

    /** Número da nota */
    @Column({ type: 'int', nullable: true })
    numero: number;

    /** Série */
    @Column({ type: 'varchar', length: 3, default: '001' })
    serie: string;

    /** Ambiente: 1=Produção, 2=Homologação */
    @Column({ type: 'int', default: 2 })
    ambiente: number;

    /** JSON com os itens da nota */
    @Column({ type: 'text', nullable: true })
    itensJson: string;

    /** PDF DANFE em base64 */
    @Column({ type: 'text', nullable: true })
    danfePdf: string;

    /** Referência ao pedido/OS do sistema */
    @Column({ type: 'varchar', nullable: true })
    orderId: string;

    /** Referência ao cliente fiscal */
    @Column({ type: 'varchar', nullable: true })
    clienteId: string;

    /** Valor total da nota */
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    valorTotal: number;

    @Column({ type: 'text', nullable: true })
    erroDetalhes: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
