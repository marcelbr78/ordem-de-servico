import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Board } from './board.entity';
import { SymptomCategory } from './symptom-category.entity';
import { Circuit } from './circuit.entity';

@Entity('board_diagnosis_sessions')
export class DiagnosticSession {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    tenantId: string;

    @Column()
    board_id: string;

    @ManyToOne(() => Board)
    @JoinColumn({ name: 'board_id' })
    board: Board;

    @Column({ nullable: true })
    technician_id: string;

    @Column({ nullable: true })
    symptom_category_id: string;

    @ManyToOne(() => SymptomCategory)
    @JoinColumn({ name: 'symptom_category_id' })
    symptomCategory: SymptomCategory;

    @Column({ nullable: true })
    active_circuit_id: string;

    @ManyToOne(() => Circuit)
    @JoinColumn({ name: 'active_circuit_id' })
    activeCircuit: Circuit;

    @Column({ type: 'text', nullable: true })
    symptom_description: string;

    @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
    charger_current: number;

    @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
    bench_current: number;

    @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
    power_button_current: number;

    @Column({ default: 'active' })
    status: string; // active, completed, abandoned

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
