import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('feature_flags')
export class FeatureFlag {
    @PrimaryGeneratedColumn('uuid') id: string;
    @Column({ unique: true }) key: string;            // ex: 'fiscal_module'
    @Column() name: string;                            // ex: 'Módulo Fiscal'
    @Column({ type: 'text', nullable: true }) description: string;
    @Column({ default: false }) enabledGlobally: boolean; // todos os tenants
    @Column({ type: 'text', nullable: true }) enabledForPlans: string;   // JSON: ["plan_id_1","plan_id_2"]
    @Column({ type: 'text', nullable: true }) enabledForTenants: string; // JSON: ["tenant_id_1"]
    @Column({ type: 'text', nullable: true }) disabledForTenants: string;// JSON override
    @Column({ type: 'text', default: 'general' }) category: string; // 'billing','integration','ui','beta'
    @Column({ default: false }) isBeta: boolean;
    @CreateDateColumn() createdAt: Date;
    @UpdateDateColumn() updatedAt: Date;
}
