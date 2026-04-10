import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Board } from './board.entity';
import { SymptomCategory } from './symptom-category.entity';
import { Circuit } from './circuit.entity';

@Entity('board_diagnosis_repair_cases')
export class RepairCase {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    tenantId: string;

    @Column()
    board_id: string;

    @ManyToOne(() => Board, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'board_id' })
    board: Board;

    @Column({ nullable: true })
    symptom_category_id: string;

    @ManyToOne(() => SymptomCategory)
    @JoinColumn({ name: 'symptom_category_id' })
    symptomCategory: SymptomCategory;

    @Column({ type: 'text', nullable: true })
    symptom: string;

    @Column({ type: 'simple-json', nullable: true })
    measurements_summary: any;

    @Column({ nullable: true })
    circuit_id: string;

    @ManyToOne(() => Circuit)
    @JoinColumn({ name: 'circuit_id' })
    circuit: Circuit;

    @Column({ nullable: true })
    defective_component: string;

    @Column({ type: 'text', nullable: true })
    repair_action: string;

    @Column({ default: false })
    success: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
