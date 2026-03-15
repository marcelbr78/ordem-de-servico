import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Diagnosis } from './entities/diagnosis.entity';
import { OSStatus } from '../orders/entities/order-service.entity';
import { OrdersService } from '../orders/orders.service';
import { CreateDiagnosisDto } from './dto/create-diagnosis.dto';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class DiagnosisService {
    constructor(
        @InjectRepository(Diagnosis)
        private diagnosisRepository: Repository<Diagnosis>,
        private ordersService: OrdersService,
        private whatsappService: WhatsappService,
    ) { }

    async create(createDto: CreateDiagnosisDto): Promise<Diagnosis> {
        const order = await this.ordersService.findOne(createDto.orderId);
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

        // Atualizar status da OS para ORCAMENTO (AGUARDANDO_APROVACAO) via State Machine
        // TODO: Ajustar se necessário para usar changeStatus
        // Como o changeStatus exige DTO, vamos chamar direto ou adaptar
        await this.ordersService.changeStatus(order.id, {
            status: OSStatus.AGUARDANDO_APROVACAO,
            comments: `Diagnóstico realizado. Laudo: ${savedDiagnosis.technicalReport}. Valor: R$ ${totalValue}`
        });

        // Notificar Orçamento Disponível (mantido no service de diagnosis, ou mover para orders?)
        // Vamos manter aqui por ser específico de orçamento
        const clientContatos = order.client?.contatos || [];
        const whatsappContact = clientContatos.find(c => c.tipo === 'whatsapp' && c.principal)
            || clientContatos.find(c => c.tipo === 'whatsapp');
        if (whatsappContact) {
            await this.whatsappService.sendBudgetAvailable(whatsappContact.numero, order.protocol);
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

        // Atualizar OS para APROVADO (AGUARDANDO_PECA ou EM_REPARO)
        // Regra de negócio: Vamos assumir que vai para AGUARDANDO_PECA inicialmente
        await this.ordersService.changeStatus(orderId, {
            status: OSStatus.AGUARDANDO_PECA,
            comments: 'Orçamento APROVADO pelo cliente.'
        });

        return updatedDiagnosis;
    }

    async reject(orderId: string): Promise<Diagnosis> {
        const diagnosis = await this.findByOrder(orderId);
        if (diagnosis.approvalStatus !== 'pending') {
            throw new ConflictException('Este diagnóstico já foi processado');
        }

        diagnosis.approvalStatus = 'rejected';
        const updatedDiagnosis = await this.diagnosisRepository.save(diagnosis);

        // Atualizar OS para RECUSADO (AGUARDANDO_RETIRADA ou FINALIZADA/ENTREGUE?)
        // Vamos usar CANCELADA ou ENTREGUE dependendo do fluxo. 
        // O plano dizia: -> CANCELADA ou DEVOLUCAO/ENTREGUE.
        // Vamos mandar para CANCELADA por enquanto, ou FINALIZADA se cobrar taxa.
        // Assumindo CANCELADA por recusa.
        await this.ordersService.changeStatus(orderId, {
            status: OSStatus.CANCELADA,
            comments: 'Orçamento RECUSADO pelo cliente.'
        });

        return updatedDiagnosis;
    }
}
