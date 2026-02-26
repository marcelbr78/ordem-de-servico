import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('fiscal_servicos')
export class FiscalServico {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 500 })
    descricao: string;

    /** Código do serviço conforme lista LC 116/03 */
    @Column({ type: 'varchar', length: 10 })
    codigoServico: string;

    /** Código CNAE se exigido pelo município */
    @Column({ type: 'varchar', length: 10, nullable: true })
    cnae: string;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 5 })
    aliquotaIss: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    valor: number;

    /** Discriminação completa do serviço (texto livre para NFS-e) */
    @Column({ type: 'text', nullable: true })
    discriminacao: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
