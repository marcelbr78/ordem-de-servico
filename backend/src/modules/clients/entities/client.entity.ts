import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    OneToMany,
    Index,
} from 'typeorm';
import { ClientContact } from './client-contact.entity';
import { ClientOsHistory } from './client-os-history.entity';

export enum ClientType {
    PF = 'PF',
    PJ = 'PJ',
}

export enum ClientStatus {
    ATIVO = 'ativo',
    INATIVO = 'inativo',
}

@Entity('clients')
export class Client {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'text', default: ClientType.PF })
    tipo: ClientType;

    @Column({ default: '' })
    nome: string;

    @Column({ nullable: true })
    nomeFantasia: string;

    @Column({ unique: true, nullable: true })
    @Index()
    cpfCnpj: string;

    @Column({ nullable: true })
    email: string;

    // ─── Endereço Estruturado ──────────────────────

    @Column({ nullable: true })
    cep: string;

    @Column({ nullable: true })
    rua: string;

    @Column({ nullable: true })
    numero: string;

    @Column({ nullable: true })
    complemento: string;

    @Column({ nullable: true })
    bairro: string;

    @Column({ nullable: true })
    cidade: string;

    @Column({ nullable: true })
    estado: string;

    // Fallback para endereço não-estruturado (migração)
    @Column({ type: 'text', nullable: true })
    endereco: string;

    // ─── Outros ────────────────────────────────────

    @Column({ type: 'text', nullable: true })
    observacoes: string;

    @Column({ type: 'text', default: ClientStatus.ATIVO })
    status: ClientStatus;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;

    @OneToMany(() => ClientContact, (contact) => contact.client, { cascade: true })
    contatos: ClientContact[];

    @OneToMany(() => ClientOsHistory, (history) => history.client)
    osHistorico: ClientOsHistory[];
}
