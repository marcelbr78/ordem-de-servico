import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Client } from './client.entity';

export enum ContactType {
    TELEFONE = 'telefone',
    WHATSAPP = 'whatsapp',
    RECADOS = 'recados',
}

@Entity('clientes_contatos')
export class ClientContact {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    clienteId: string;

    @ManyToOne(() => Client, (client) => client.contatos, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'clienteId' })
    client: Client;

    @Column({ type: 'text', default: ContactType.TELEFONE })
    tipo: ContactType;

    @Column()
    numero: string;

    @Column({ default: false })
    principal: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
