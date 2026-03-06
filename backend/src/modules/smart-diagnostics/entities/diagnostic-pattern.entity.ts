import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('diagnostic_patterns')
@Index(['tenantId', 'model', 'symptom'])
export class DiagnosticPattern {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    tenantId: string;

    @Column({ nullable: true })
    equipment_type: string;

    @Column({ nullable: true })
    brand: string;

    @Column({ nullable: true })
    model: string;

    @Column({ nullable: true })
    symptom: string;

    @Column()
    diagnosis: string;

    @Column({ default: 1 })
    frequency: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    avg_price: number;

    @Column({ type: 'int', default: 0 }) // Stored in minutes
    avg_repair_time: number;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    last_updated: Date;
}
