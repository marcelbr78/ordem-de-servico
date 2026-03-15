import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('plans')
export class Plan {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    description: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    price: number;

    @Column({ type: 'int', default: 0 })  // 0 = ilimitado
    osLimit: number;

    @Column({ type: 'int', default: 0 })  // 0 = ilimitado
    usersLimit: number;

    @Column({ type: 'int', default: 0 })  // 0 = ilimitado
    storageLimit: number;

    @Column({ type: 'boolean', default: true })
    active: boolean;

    @Column({ type: 'boolean', default: false })
    isDefault: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
