import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { DiagnosticBoard } from './diagnostic-board.entity';

@Entity('power_sequence_steps')
export class PowerSequenceStep {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => DiagnosticBoard, board => board.steps, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'board_id' })
    board: DiagnosticBoard;

    @Column({ name: 'step_order' })
    stepOrder: number;

    @Column({ name: 'rail_name' })
    railName: string;

    @Column({ name: 'expected_voltage', nullable: true })
    expectedVoltage: string;

    @Column({ default: true })
    required: boolean;

    @Column({ name: 'group_name', nullable: true })
    groupName: string;
}
