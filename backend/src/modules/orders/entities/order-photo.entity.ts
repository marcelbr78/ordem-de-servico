import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { OrderService } from './order-service.entity';
import { OrderEquipment } from './order-equipment.entity';

export enum PhotoCategory {
    ENTRADA = 'ENTRADA',
    DEFEITO = 'DEFEITO',
    REPARO = 'REPARO',
    SAIDA = 'SAIDA',
    OUTROS = 'OUTROS',
}

@Entity('order_photos')
export class OrderPhoto {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    orderId: string;

    @ManyToOne(() => OrderService, order => order.photos, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'orderId' })
    order: OrderService;

    @Column({ nullable: true })
    equipmentId: string;

    @ManyToOne(() => OrderEquipment, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'equipmentId' })
    equipment: OrderEquipment;

    @Column()
    url: string; // Caminho local ou URL S3

    @Column({ nullable: true })
    publicId: string;

    @Column({
        type: 'text',
        default: PhotoCategory.OUTROS
    })
    category: PhotoCategory;

    @Column({ type: 'text', nullable: true })
    description: string;

    @CreateDateColumn()
    createdAt: Date;
}
