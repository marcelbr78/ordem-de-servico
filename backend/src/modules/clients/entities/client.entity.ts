import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

@Entity('clients')
export class Client {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ unique: true })
    whatsapp: string; // Formato internacional: 5511999999999

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    document: string; // CPF ou CNPJ

    @Column({ type: 'text', nullable: true })
    address: string;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // No futuro, teremos aqui o relacionamento com as Ordens de Serviço
    // @OneToMany(() => OrderService, (os) => os.client)
    // orders: OrderService[];
}
