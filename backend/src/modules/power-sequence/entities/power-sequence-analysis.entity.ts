import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { DiagnosticBoard } from './diagnostic-board.entity';

@Entity('power_sequence_analysis')
export class PowerSequenceAnalysis {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => DiagnosticBoard, board => board.analyses, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'board_id' })
    board: DiagnosticBoard;

    @Column('simple-json', { name: 'rails_detected' })
    railsDetected: string[]; // Store array of detected rail names

    @Column({ type: 'text', nullable: true })
    result: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
