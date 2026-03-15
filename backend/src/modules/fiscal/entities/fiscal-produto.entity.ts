import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('fiscal_produtos')
export class FiscalProduto {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 200 })
    nome: string;

    /** Nomenclatura Comum do Mercosul */
    @Column({ type: 'varchar', length: 8 })
    ncm: string;

    /** Código Fiscal de Operações e Prestações */
    @Column({ type: 'varchar', length: 4 })
    cfop: string;

    /** Código de Situação da Operação do Simples Nacional */
    @Column({ type: 'varchar', length: 3, nullable: true })
    csosn: string;

    /** Código de Situação Tributária ICMS */
    @Column({ type: 'varchar', length: 3, nullable: true })
    cst: string;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    aliquotaIcms: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    aliquotaPis: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    aliquotaCofins: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    valor: number;

    @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
    estoque: number;

    /** Unidade comercial: UN, KG, MT, etc. */
    @Column({ type: 'varchar', length: 6, default: 'UN' })
    unidade: string;

    @Column({ type: 'varchar', length: 60, nullable: true })
    codigoBarras: string;

    /** Link ao produto do inventário existente */
    @Column({ type: 'varchar', nullable: true })
    productId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
