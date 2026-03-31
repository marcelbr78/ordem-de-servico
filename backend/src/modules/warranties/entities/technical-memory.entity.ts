import {
    Entity, PrimaryGeneratedColumn, Column, Index,
    CreateDateColumn,
} from 'typeorm';

@Entity('technical_memory')
@Index(['tenantId', 'equipmentBrand', 'equipmentModel'])
export class TechnicalMemory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    tenantId: string;

    // OS de onde veio este conhecimento
    @Column({ nullable: true })
    orderId: string;

    @Column({ nullable: true })
    orderProtocol: string;

    // Identificação do equipamento
    @Column({ nullable: true })
    equipmentType: string;    // ex: Smartphone

    @Column({ nullable: true })
    equipmentBrand: string;   // ex: Apple

    @Column({ nullable: true })
    equipmentModel: string;   // ex: iPhone 13

    // O conhecimento técnico
    @Column({ type: 'text' })
    symptom: string;          // ex: tela piscando

    @Column({ type: 'text', nullable: true })
    rootCause: string;        // ex: conector solto

    @Column({ type: 'text', nullable: true })
    solution: string;         // ex: reconexão + limpeza

    @Column({ nullable: true })
    partUsed: string;         // ex: display original

    // Quantas vezes esse padrão se repetiu (incrementado automaticamente)
    @Column({ type: 'int', default: 1 })
    recurrenceCount: number;

    @Column({ nullable: true })
    technicianId: string;

    @Column({ nullable: true })
    technicianName: string;

    @CreateDateColumn()
    createdAt: Date;
}
