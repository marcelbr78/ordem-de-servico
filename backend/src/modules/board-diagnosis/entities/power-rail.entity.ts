import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Board } from './board.entity';
import { Circuit } from './circuit.entity';

@Entity('board_diagnosis_power_rails')
export class PowerRail {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    board_id: string;

    @ManyToOne(() => Board, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'board_id' })
    board: Board;

    @Column()
    circuit_id: string;

    @ManyToOne(() => Circuit, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'circuit_id' })
    circuit: Circuit;

    @Column()
    name: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    voltage_nominal: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
