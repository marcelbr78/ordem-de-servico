import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { PowerSequenceStep } from './power-sequence-step.entity';
import { PowerSequenceAnalysis } from './power-sequence-analysis.entity';

@Entity('diagnostic_boards')
export class DiagnosticBoard {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    model: string;

    @Column()
    manufacturer: string;

    @Column({ nullable: true })
    description: string;

    @OneToMany(() => PowerSequenceStep, step => step.board)
    steps: PowerSequenceStep[];

    @OneToMany(() => PowerSequenceAnalysis, analysis => analysis.board)
    analyses: PowerSequenceAnalysis[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
