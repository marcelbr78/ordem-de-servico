import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderService, OSStatus } from './entities/order-service.entity';
import { CreateOrderServiceDto } from './dto/create-order-service.dto';
import { UpdateOrderServiceDto } from './dto/update-order-service.dto';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { ClientsService } from '../clients/clients.service';

@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(OrderService)
        private ordersRepository: Repository<OrderService>,
        private whatsappService: WhatsappService,
        private clientsService: ClientsService,
    ) { }

    async create(createOrderDto: CreateOrderServiceDto): Promise<OrderService> {
        const protocol = await this.generateProtocol();
        const order = this.ordersRepository.create({
            ...createOrderDto,
            protocol,
        });
        const savedOrder = await this.ordersRepository.save(order);

        // Notificar via WhatsApp
        const client = await this.clientsService.findOne(savedOrder.clientId);
        if (client) {
            await this.whatsappService.sendOSCreated(client.whatsapp, savedOrder.protocol, savedOrder.equipment);
        }

        return savedOrder;
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
