import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Diagnosis } from './entities/diagnosis.entity';
import { OrderService, OSStatus } from '../orders/entities/order-service.entity';
import { CreateDiagnosisDto } from './dto/create-diagnosis.dto';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class DiagnosisService {
    constructor(
        @InjectRepository(Diagnosis)
        private diagnosisRepository: Repository<Diagnosis>,
        @InjectRepository(OrderService)
        private ordersRepository: Repository<OrderService>,
        private whatsappService: WhatsappService,
    ) { }

    async create(createDto: CreateDiagnosisDto): Promise<Diagnosis> {
        const order = await this.ordersRepository.findOne({ where: { id: createDto.orderId } });
        if (!order) {
            throw new NotFoundException('Ordem de Serviço não encontrada');
        }

        const existingDiagnosis = await this.diagnosisRepository.findOne({ where: { orderId: createDto.orderId } });
        if (existingDiagnosis) {
            throw new ConflictException('Já existe um diagnóstico para esta Ordem de Serviço');
        }

        // Calcular valor total das peças se existir
        let partsTotal = 0;
        if (createDto.partsNeeded && Array.isArray(createDto.partsNeeded)) {
            partsTotal = createDto.partsNeeded.reduce((acc, part) => acc + (part.price * (part.quantity || 1)), 0);
        }

        const totalValue = Number(createDto.laborValue) + partsTotal;

        const diagnosis = this.diagnosisRepository.create({
            ...createDto,
            totalValue,
        });

        const savedDiagnosis = await this.diagnosisRepository.save(diagnosis);

        // Atualizar status da OS para ORCAMENTO e o valor estimado
        order.status = OSStatus.ORCAMENTO;
        order.estimatedValue = totalValue;
        order.diagnosis = savedDiagnosis.technicalReport; // Opcional: sincronizar laudo simples
        await this.ordersRepository.save(order);

        // Notificar Orçamento Disponível
        if (order.client?.whatsapp) {
            await this.whatsappService.sendBudgetAvailable(order.client.whatsapp, order.protocol);
        }

        return savedDiagnosis;
    }

    async findByOrder(orderId: string): Promise<Diagnosis> {
        const diagnosis = await this.diagnosisRepository.findOne({
            where: { orderId },
            relations: ['order']
        });
        if (!diagnosis) {
            throw new NotFoundException('Diagnóstico não encontrado para esta OS');
        }
        return diagnosis;
    }

    async approve(orderId: string): Promise<Diagnosis> {
        const diagnosis = await this.findByOrder(orderId);
        if (diagnosis.approvalStatus !== 'pending') {
            throw new ConflictException('Este diagnóstico já foi processado');
        }

        diagnosis.approvalStatus = 'approved';
        diagnosis.approvedAt = new Date();
        const updatedDiagnosis = await this.diagnosisRepository.save(diagnosis);

        // Atualizar OS para APROVADO
        const order = await this.ordersRepository.findOne({ where: { id: orderId } });
        order.status = OSStatus.APROVADO;
        await this.ordersRepository.save(order);

        return updatedDiagnosis;
    }

    async reject(orderId: string): Promise<Diagnosis> {
        const diagnosis = await this.findByOrder(orderId);
        if (diagnosis.approvalStatus !== 'pending') {
            throw new ConflictException('Este diagnóstico já foi processado');
        }

        diagnosis.approvalStatus = 'rejected';
        const updatedDiagnosis = await this.diagnosisRepository.save(diagnosis);

        // Atualizar OS para RECUSADO
        const order = await this.ordersRepository.findOne({ where: { id: orderId } });
        order.status = OSStatus.RECUSADO;
        await this.ordersRepository.save(order);

        return updatedDiagnosis;
    }
}
