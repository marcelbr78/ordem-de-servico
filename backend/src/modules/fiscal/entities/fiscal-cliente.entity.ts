import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('fiscal_clientes')
export class FiscalCliente {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 200 })
    nome: string;

    /** CPF (11 dígitos) ou CNPJ (14 dígitos) — apenas números */
    @Column({ type: 'varchar', length: 14 })
    cpfCnpj: string;

    @Column({ type: 'varchar', length: 200, nullable: true })
    endereco: string;

    @Column({ type: 'varchar', length: 10, nullable: true })
    numero: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    complemento: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    bairro: string;

    @Column({ type: 'varchar', length: 100 })
    cidade: string;

    /** Código IBGE do município */
    @Column({ type: 'varchar', length: 7, nullable: true })
    codigoIbge: string;

    @Column({ type: 'varchar', length: 2, default: 'SC' })
    uf: string;

    @Column({ type: 'varchar', length: 8, nullable: true })
    cep: string;

    @Column({ type: 'varchar', length: 200, nullable: true })
    email: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    telefone: string;

    /** Indica se é Pessoa Jurídica (true) ou Física (false) */
    @Column({ type: 'boolean', default: false })
    isPj: boolean;

    /** Inscrição Municipal (apenas PJ) */
    @Column({ type: 'varchar', length: 30, nullable: true })
    inscricaoMunicipal: string;

    /** Inscrição Estadual (apenas PJ) */
    @Column({ type: 'varchar', length: 30, nullable: true })
    inscricaoEstadual: string;

    /** Link ao cliente do sistema */
    @Column({ type: 'varchar', nullable: true })
    clientId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
