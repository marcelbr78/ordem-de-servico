import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum UserRole {
    ADMIN = 'admin',
    TECHNICIAN = 'technician',
    ATTENDANT = 'attendant',
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @Column()
    name: string;

    @Column({
        type: 'text',
        default: UserRole.ATTENDANT,
    })
    role: UserRole;

    @Column({ default: true })
    @Index()
    isActive: boolean;

    @Column({ nullable: true })
    @Index()
    refreshTokenHash: string;

    @Column({ nullable: true })
    lastLogin: Date;

    @Column({ default: false })
    mustChangePassword: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
