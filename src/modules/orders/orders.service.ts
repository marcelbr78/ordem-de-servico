import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderService, OSStatus } from './entities/order-service.entity';
import { CreateOrderServiceDto } from './dto/create-order-service.dto';
import { UpdateOrderServiceDto } from './dto/update-order-service.dto';

@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(OrderService)
        private ordersRepository: Repository<OrderService>,
    ) { }

    async create(createOrderDto: CreateOrderServiceDto): Promise<OrderService> {
        const protocol = await this.generateProtocol();
        const order = this.ordersRepository.create({
            ...createOrderDto,
            protocol,
        });
        return this.ordersRepository.save(order);
    }

    async findAll(): Promise<OrderService[]> {
        return this.ordersRepository.find({
            order: { entryDate: 'DESC' },
        });
    }

    async findOne(id: string): Promise<OrderService> {
        const order = await this.ordersRepository.findOne({ where: { id } });
        if (!order) {
            throw new NotFoundException('Ordem de Serviço não encontrada');
        }
        return order;
    }

    async update(id: string, updateOrderDto: UpdateOrderServiceDto): Promise<OrderService> {
        const order = await this.findOne(id);

        // Se mudar para entregue, registra data de saída
        if (updateOrderDto.status === OSStatus.ENTREGUE && order.status !== OSStatus.ENTREGUE) {
            order.exitDate = new Date();
        }

        const updatedOrder = this.ordersRepository.merge(order, updateOrderDto);
        return this.ordersRepository.save(updatedOrder);
    }

    private async generateProtocol(): Promise<string> {
        const date = new Date();
        const prefix = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        const count = await this.ordersRepository.count();
        const sequence = (count + 1).toString().padStart(4, '0');
        return `${prefix}-${sequence}`;
    }
}
