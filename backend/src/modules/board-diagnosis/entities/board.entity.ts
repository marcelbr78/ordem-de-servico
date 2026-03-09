import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('board_diagnosis_boards')
export class Board {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    model: string;

    @Column()
    manufacturer: string;

    @Column({ nullable: true })
    schematic_file: string;

    @Column({ nullable: true })
    boardview_file: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
