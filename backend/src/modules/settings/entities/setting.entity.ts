import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum SettingType {
    STRING = 'string',
    NUMBER = 'number',
    BOOLEAN = 'boolean',
    JSON = 'json',
}

@Entity('system_settings')
export class SystemSetting {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    key: string;

    @Column({ type: 'text' })
    value: string;

    @Column({
        type: 'text',
        default: SettingType.STRING
    })
    type: SettingType;

    @Column({ nullable: true })
    description: string;

    @Column({ default: false })
    isPublic: boolean; // If true, can be fetched without auth (e.g. for login page customization)

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
