import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { DiagnosticSession } from './diagnostic-session.entity';

@Entity('board_diagnosis_steps')
export class DiagnosticStep {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    session_id: string;

    @ManyToOne(() => DiagnosticSession, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'session_id' })
    session: DiagnosticSession;

    @Column()
    step_number: number;

    @Column()
    question: string;

    @Column({ nullable: true })
    measurement_type: string; // e.g., voltage, resistance, diode

    @Column({ nullable: true })
    expected_range: string; // e.g., 12V - 13V

    @Column({ type: 'text', nullable: true })
    measurement: string; // Technician's input

    @Column({ nullable: true })
    result: string; // pass, fail, unknown

    @Column({ nullable: true })
    next_step_if_ok: string;

    @Column({ nullable: true })
    next_step_if_fail: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
