import {
    Entity, PrimaryGeneratedColumn, Column, Index,
    CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { OrderService } from '../../orders/entities/order-service.entity';

export enum WarrantyReturnStatus {
    PENDING    = 'pendente',
    EVALUATING = 'em_avaliacao',
    APPROVED   = 'aprovada',
    DENIED     = 'negada',
    COMPLETED  = 'concluida',
}

@Entity('warranty_returns')
@Index(['tenantId', 'originalOrderId'])
export class WarrantyReturn {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    tenantId: string;

    // OS original que gerou a garantia
    @Column()
    originalOrderId: string;

    @ManyToOne(() => OrderService, { onDelete: 'SET NULL', nullable: true, eager: false })
    @JoinColumn({ name: 'originalOrderId' })
    originalOrder: OrderService;

    // Sub-OS gerada para o reparo de garantia (se necessário)
    @Column({ nullable: true })
    linkedOrderId: string;

    // Usuários envolvidos (IDs, sem relação para evitar dependência circular)
    @Column()
    openedById: string;

    @Column({ nullable: true })
    openedByName: string;

    @Column({ nullable: true })
    evaluatedById: string;

    @Column({ nullable: true })
    evaluatedByName: string;

    @Column({ nullable: true })
    authorizedById: string;

    @Column({ nullable: true })
    authorizedByName: string;

    // Status do retorno
    @Column({ type: 'varchar', default: WarrantyReturnStatus.PENDING })
    status: WarrantyReturnStatus;

    // O que o cliente relata ao retornar
    @Column({ type: 'text' })
    defectDescription: string;

    // Avaliação técnica (técnico preenche)
    @Column({ type: 'text', nullable: true })
    techEvaluation: string;

    // É o mesmo defeito da OS original?
    @Column({ nullable: true })
    isSameDefect: boolean;

    // Garantia válida ou negada
    @Column({ nullable: true })
    warrantyValid: boolean;

    // O que foi feito para resolver
    @Column({ type: 'text', nullable: true })
    resolution: string;

    // Motivo da negação (se negada)
    @Column({ type: 'text', nullable: true })
    denialReason: string;

    // Snapshot da data de validade da garantia no momento do retorno
    @Column({ nullable: true })
    warrantyExpiresAt: Date;

    // Calculado ao abrir: estava dentro do prazo?
    @Column({ nullable: true })
    isWithinWarranty: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
