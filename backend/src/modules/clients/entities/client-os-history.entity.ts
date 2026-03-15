import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';
import { Client } from './client.entity';

@Entity('clientes_os_historico')
export class ClientOsHistory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    clienteId: string;

    @ManyToOne(() => Client, (client) => client.osHistorico, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'clienteId' })
    client: Client;

    @Column()
    @Index()
    osId: string;

    @Column()
    osNumero: string;

    @Column({ type: 'text' })
    status: string;

    @Column({ nullable: true })
    tipoAtendimento: string;

    @Column()
    dataAbertura: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
