import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Board } from './board.entity';

@Entity('board_diagnosis_circuits')
export class Circuit {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    board_id: string;

    @ManyToOne(() => Board, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'board_id' })
    board: Board;

    @Column()
    name: string;

    @Column()
    type: string; // e.g., power_management, cpu, nand, wifi

    @Column({ type: 'text', nullable: true })
    description: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
