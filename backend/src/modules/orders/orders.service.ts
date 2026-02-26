import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner, Like } from 'typeorm';
import { OrderService, OSStatus, OSPriority } from './entities/order-service.entity';
import { OrderEquipment } from './entities/order-equipment.entity';
import { OrderPart } from './entities/order-part.entity';
import { OrderHistory, HistoryActionType } from './entities/order-history.entity';
import { OrderPhoto, PhotoCategory } from './entities/order-photo.entity';
import { CreateOrderServiceDto } from './dto/create-order-service.dto';
import { UpdateOrderServiceDto } from './dto/update-order-service.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { ClientsService } from '../clients/clients.service';
import { StockService } from '../inventory/stock.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { SettingsService } from '../settings/settings.service';
import { LookupService } from './lookup.service';
import { FinanceService } from '../finance/finance.service';
import { TransactionType } from '../finance/entities/transaction.entity';

@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(OrderService)
        private ordersRepository: Repository<OrderService>,
        @InjectRepository(OrderEquipment)
        private equipmentsRepository: Repository<OrderEquipment>,
        @InjectRepository(OrderHistory)
        private historyRepository: Repository<OrderHistory>,
        @InjectRepository(OrderPhoto)
        private photoRepository: Repository<OrderPhoto>,
        @InjectRepository(OrderPart)
        private partsRepository: Repository<OrderPart>,

        private dataSource: DataSource,
        private whatsappService: WhatsappService,
        private clientsService: ClientsService,
        @Inject(forwardRef(() => StockService))
        private stockService: StockService,
        private cloudinaryService: CloudinaryService,
        private settingsService: SettingsService,
        private lookupService: LookupService,
        private financeService: FinanceService
    ) { }

    private async getStatusFlow(current: OSStatus): Promise<OSStatus[]> {
        const customFlowJson = await this.settingsService.findByKey('os_custom_workflow');
        if (customFlowJson) {
            try {
                const config = JSON.parse(customFlowJson);
                if (config.flow && Array.isArray(config.flow[current])) {
                    return config.flow[current];
                }
            } catch (e) {
                console.error('Error parsing os_custom_workflow:', e);
            }
        }

        // Default Fallback
        switch (current) {
            case OSStatus.ABERTA:
                return [OSStatus.EM_DIAGNOSTICO, OSStatus.CANCELADA];
            case OSStatus.EM_DIAGNOSTICO:
                return [OSStatus.AGUARDANDO_APROVACAO, OSStatus.AGUARDANDO_PECA, OSStatus.CANCELADA];
            case OSStatus.AGUARDANDO_APROVACAO:
                return [OSStatus.AGUARDANDO_PECA, OSStatus.EM_REPARO, OSStatus.CANCELADA];
            case OSStatus.AGUARDANDO_PECA:
                return [OSStatus.EM_REPARO, OSStatus.AGUARDANDO_APROVACAO];
            case OSStatus.EM_REPARO:
                return [OSStatus.TESTES, OSStatus.AGUARDANDO_PECA];
            case OSStatus.TESTES:
                return [OSStatus.FINALIZADA, OSStatus.EM_REPARO];
            case OSStatus.FINALIZADA:
                return [OSStatus.ENTREGUE, OSStatus.EM_REPARO];
            case OSStatus.ENTREGUE:
                return [];
            case OSStatus.CANCELADA:
                return [];
            default:
                return [];
        }
    }

    async create(dto: CreateOrderServiceDto, userId?: string): Promise<OrderService> {
        // 1. Validar Cliente
        const client = await this.clientsService.findOne(dto.clientId);
        if (client.status !== 'ativo') {
            throw new BadRequestException('Cliente inativo não pode abrir novas OS');
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 2. Criar Header da OS
            const protocol = await this.generateProtocol(queryRunner);
            const order = queryRunner.manager.create(OrderService, {
                clientId: dto.clientId,
                technicianId: dto.technicianId,
                priority: dto.priority,
                estimatedValue: dto.estimatedValue || 0,
                protocol,
                status: OSStatus.ABERTA,
            });
            const savedOrder = await queryRunner.manager.save(order);

            // 3. Criar Equipamentos
            for (const equipDto of dto.equipments) {
                const equipment = queryRunner.manager.create(OrderEquipment, {
                    ...equipDto,
                    orderId: savedOrder.id,
                });
                await queryRunner.manager.save(equipment);
            }

            // 4. Criar Histórico Inicial
            const history = queryRunner.manager.create(OrderHistory, {
                orderId: savedOrder.id,
                actionType: HistoryActionType.SYSTEM,
                previousStatus: null,
                newStatus: OSStatus.ABERTA,
                comments: dto.initialObservations || 'Ordem de Serviço criada',
                userId: userId,
            });
            await queryRunner.manager.save(history);

            await queryRunner.commitTransaction();

            // 5. Notificar WhatsApp (fora da transação para não bloquear)
            this.notifyClient(client, savedOrder);

            return this.findOne(savedOrder.id);

        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw new InternalServerErrorException('Erro ao criar OS: ' + err.message);
        } finally {
            await queryRunner.release();
        }
    }

    async changeStatus(id: string, dto: ChangeStatusDto, userId?: string): Promise<OrderService> {
        const order = await this.findOne(id);
        // Validacao de fluxo removida a pedido (Modo Liberdade)
        // const allowed = await this.getStatusFlow(order.status);

        // if (!allowed.includes(dto.status)) {
        //     throw new BadRequestException(
        //         `Transição inválida: ${order.status} -> ${dto.status}. Permitidos: ${allowed.join(', ')}`
        //     );
        // }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const previousStatus = order.status;
            console.log(`[OrdersService] Alterando status da OS ${id}: ${previousStatus} -> ${dto.status}`);
            // Usar update em vez de save para evitar que o TypeORM tente sincronizar 
            // e atualizar relações em cascata que podem estar com IDs inconsistentes no objeto carregado
            await queryRunner.manager.update(OrderService, id, {
                status: dto.status,
                ...(dto.status === OSStatus.ENTREGUE || dto.status === OSStatus.CANCELADA ? { exitDate: new Date() } : {})
            });

            console.log(`[OrdersService] Criando registro de histórico para OS ${id}`);
            await queryRunner.manager.insert(OrderHistory, {
                orderId: order.id,
                actionType: HistoryActionType.STATUS_CHANGE,
                previousStatus: previousStatus,
                newStatus: dto.status,
                comments: dto.comments,
                userId: userId,
            });

            // --- STOCK & FINANCE INTEGRATION ---
            if (dto.status === OSStatus.FINALIZADA) {
                const parts = await queryRunner.manager.find(OrderPart, { where: { orderId: order.id } });

                // 1. Calculate Total Value
                const totalValue = parts.reduce((acc, p) => acc + (Number(p.unitPrice) * p.quantity), 0);
                await queryRunner.manager.update(OrderService, id, { finalValue: totalValue });

                // 2. Consume Stock
                if (parts.length > 0) {
                    await this.stockService.consumeStock(
                        order.id,
                        parts.map(p => ({ productId: p.productId, quantity: p.quantity })),
                        queryRunner.manager
                    );
                }

                // 3. Register Financial Transaction
                if (totalValue > 0) {
                    console.log(`[OrdersService] Registrando transação financeira para OS ${id}. Banco: ${dto.bankAccountId || 'Nenhum'}`);
                    await this.financeService.create({
                        type: TransactionType.INCOME,
                        amount: totalValue,
                        category: 'Pagamento de OS',
                        description: `Pagamento da OS #${order.protocol} - Cliente: ${order.client?.nome || 'Cliente'} (${dto.paymentMethod || 'A definir'})`,
                        orderId: order.id,
                        paymentMethod: dto.paymentMethod || 'A definir',
                        bankAccountId: dto.bankAccountId,
                    }, queryRunner.manager);
                }
            }

            if (dto.status === OSStatus.CANCELADA) {
                console.log(`[OrdersService] Revertendo estoque para OS ${id}`);
                await this.stockService.reverseMovement(order.id, queryRunner.manager);
            }

            await queryRunner.commitTransaction();
            console.log(`[OrdersService] Transação concluída com sucesso para OS ${id}`);

            // Notificar cliente se necessário (implementar depois)

            return this.findOne(id);
        } catch (err) {
            await queryRunner.rollbackTransaction();
            console.error(`[OrdersService] ERRO ao mudar status da OS ${id}:`, err.message);
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    async update(id: string, dto: UpdateOrderServiceDto): Promise<OrderService> {
        const order = await this.findOne(id);
        const updated = Object.assign(order, dto);
        await this.ordersRepository.save(updated);
        return this.findOne(id);
    }

    async findAll(withDeleted = false): Promise<OrderService[]> {
        return this.ordersRepository.find({
            relations: ['client', 'equipments'],
            order: { entryDate: 'DESC' },
            withDeleted,
        });
    }

    async findAllActive(): Promise<OrderService[]> {
        console.log('Fetching all active orders for monitor...');
        const orders = await this.ordersRepository.createQueryBuilder('order')
            .leftJoinAndSelect('order.client', 'client')
            .leftJoinAndSelect('order.equipments', 'equipments')
            .where('order.status NOT IN (:...statuses)', {
                statuses: [OSStatus.ENTREGUE, OSStatus.CANCELADA]
            })
            .orderBy('CASE WHEN order.priority = :urgente THEN 1 WHEN order.priority = :alta THEN 2 WHEN order.priority = :normal THEN 3 ELSE 4 END', 'ASC')
            .addOrderBy('order.entryDate', 'ASC') // Older first to avoid being forgotten
            .setParameter('urgente', OSPriority.URGENTE)
            .setParameter('alta', OSPriority.ALTA)
            .setParameter('normal', OSPriority.NORMAL)
            .getMany();

        console.log(`Found ${orders.length} active orders.`);
        return orders;
    }

    async findByClient(clientId: string): Promise<OrderService[]> {
        return this.ordersRepository.find({
            where: { clientId },
            relations: ['equipments'],
            order: { entryDate: 'DESC' },
        });
    }

    async findOne(idOrProtocol: string): Promise<OrderService> {
        // Check if it's a UUID
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrProtocol);

        const order = await this.ordersRepository.findOne({
            where: isUuid ? { id: idOrProtocol } : { protocol: idOrProtocol },
            relations: ['client', 'equipments', 'history', 'history.user', 'photos', 'parts', 'parts.product'],
            order: {
                history: { createdAt: 'DESC' }
            }
        });
        if (!order) throw new NotFoundException('OS não encontrada');

        // Populate client contacts manually
        if (order.client) {
            try {
                const fullClient = await this.clientsService.findOne(order.client.id);
                order.client = fullClient;
            } catch (e) {
                console.error('Error loading full client details', e);
            }
        }

        return order;
    }

    private async generateProtocol(queryRunner: QueryRunner): Promise<string> {
        const date = new Date();
        const prefix = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}`;

        // Find the last order created in this month, including deleted ones
        const lastOrder = await queryRunner.manager.findOne(OrderService, {
            where: { protocol: Like(`${prefix}-%`) },
            order: { protocol: 'DESC' },
            withDeleted: true
        });

        let sequence = 1;
        if (lastOrder && lastOrder.protocol) {
            const parts = lastOrder.protocol.split('-');
            if (parts.length === 2) {
                const lastSequence = parseInt(parts[1], 10);
                if (!isNaN(lastSequence)) {
                    sequence = lastSequence + 1;
                }
            }
        }

        return `${prefix}-${sequence.toString().padStart(4, '0')}`;
    }

    private async notifyClient(client: any, order: OrderService) {
        if (!client || !client.contatos) return;

        // Find best WhatsApp number
        const contact = client.contatos.find(c => c.tipo === 'whatsapp' && c.principal)
            || client.contatos.find(c => c.tipo === 'whatsapp')
            || client.contatos.find(c => c.principal && c.numero)
            || client.contatos.find(c => c.numero);

        if (contact && contact.numero) {
            try {
                const device = order.equipments?.[0] ? `${order.equipments[0].type} ${order.equipments[0].model}` : 'seu equipamento';
                await this.whatsappService.sendOSCreated(contact.numero, order.protocol, device);
                console.log(`[WhatsApp] Initial notification sent to ${contact.numero} for OS ${order.protocol}`);
            } catch (error) {
                console.error(`[WhatsApp] Failed to send initial notification for OS ${order.protocol}:`, error);
            }
        }
    }

    async addPhoto(orderId: string, file: Express.Multer.File): Promise<OrderPhoto> {
        const order = await this.findOne(orderId);

        // Upload to Cloudinary
        const result = await this.cloudinaryService.uploadImage(file, `assistencia/os_${orderId}`);

        const photo = this.photoRepository.create({
            orderId: order.id,
            url: result.secure_url,
            publicId: result.public_id,
            category: PhotoCategory.OUTROS,
        });

        return this.photoRepository.save(photo);
    }

    async removePhoto(photoId: string): Promise<void> {
        const photo = await this.photoRepository.findOne({ where: { id: photoId } });
        if (!photo) {
            throw new NotFoundException('Foto não encontrada');
        }

        if (photo.publicId) {
            await this.cloudinaryService.deleteImage(photo.publicId);
        }

        await this.photoRepository.remove(photo);
    }

    async shareOrder(id: string, options: {
        type: 'entry' | 'exit' | 'update';
        origin?: string;
        customNumber?: string;
        userId?: string;
        message?: string;
    }): Promise<{ success: boolean; message?: string }> {
        const { type, origin, customNumber, userId, message: customMessage } = options;
        console.log(`[WhatsApp Share] Order: ${id}, Type: ${type}, HasCustomMessage: ${!!customMessage}`);

        const order = await this.findOne(id);

        let targetNumber = customNumber;
        if (!targetNumber) {
            // Priority: WhatsApp + Principal > WhatsApp > Principal > Any number
            const contact = order.client?.contatos?.find(c => c.tipo === 'whatsapp' && c.principal && c.numero)
                || order.client?.contatos?.find(c => c.tipo === 'whatsapp' && c.numero)
                || order.client?.contatos?.find(c => c.principal && c.numero)
                || order.client?.contatos?.find(c => c.numero);
            targetNumber = contact?.numero;
        }

        if (!targetNumber) {
            throw new BadRequestException('Cliente sem telefone cadastrado e nenhum n\u00famero informado.');
        }

        // Sanitize number: remove non-digits
        targetNumber = targetNumber.replace(/\D/g, '');
        // Default to Brazil (55) if length seems to be just DDD+Phone (10 or 11 digits)
        if (targetNumber.length >= 10 && targetNumber.length <= 11) {
            targetNumber = '55' + targetNumber;
        }

        const configStatus = await this.whatsappService.getConfigStatus();
        if (!configStatus.configured || !configStatus.hasInstance) {
            throw new BadRequestException('WhatsApp n\u00e3o configurado no sistema.');
        }

        const settings = await this.settingsService.findAll();
        const storeName = settings.find(s => s.key === 'store_name')?.value || 'Nossa Loja';
        const clientName = (order.client.nome || 'Cliente').split(' ')[0];
        const device = order.equipments?.[0] ? `${order.equipments[0].type} ${order.equipments[0].model}` : 'seu equipamento';

        // Simulating the message construction from frontend
        let message = customMessage?.trim() || '';
        console.log(`[WhatsApp Share] Final Message Length: ${message.length}`);

        if (!message) {
            const frontendUrl = origin || process.env.FRONTEND_URL || 'http://localhost:5173';
            const statusUrl = `${frontendUrl}/status/${order.id}`;

            // Calculate total from parts if finalValue is not set (legacy or uncalculated)
            let total = Number(order.finalValue) || 0;
            if (total === 0 && order.parts?.length > 0) {
                total = order.parts.reduce((acc, p) => acc + (Number(p.unitPrice) * p.quantity), 0);
            }
            const totalFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total);

            if (type === 'entry') {
                const defect = order.equipments?.[0]?.reportedDefect || order.reportedDefect || 'não informado';
                message = `Olá ${clientName}, confirmamos a entrada do ${device} na ${storeName}.\n\n📄 *Protocolo:* ${order.protocol}\n🛠 *Defeito:* ${defect}\n\nAcompanhe o status em tempo real aqui: ${statusUrl}`;
            } else if (type === 'exit' || (type === 'update' && order.status === OSStatus.FINALIZADA)) {
                const lastComment = order.history?.find(h => h.comments && h.comments.length > 5)?.comments || order.history?.[0]?.comments || 'Serviço concluído.';
                message = `Olá ${clientName}, o serviço no ${device} foi finalizado!\n\n📄 *Protocolo:* ${order.protocol}\n✅ *Status:* Finalizada\n💰 *Total:* ${totalFormatted}\n💬 *Observações:* ${lastComment}\n\nAcompanhe o progresso em tempo real aqui: ${statusUrl}`;
            } else if (type === 'update') {
                // Try to find the latest status change for detailed info
                const latestHistory = order.history?.find(h => h.actionType === HistoryActionType.STATUS_CHANGE) || order.history?.[0];
                const statusLabel = latestHistory?.newStatus ? latestHistory.newStatus.toUpperCase().replace('_', ' ') : order.status.toUpperCase().replace('_', ' ');
                const comment = latestHistory?.comments || 'Status atualizado.';

                message = `Olá ${clientName}, informamos que o status da sua Ordem de Serviço #${order.protocol} (${device}) foi atualizado para: *${statusLabel}*.\n\n💬 *Observações:* ${comment}\n\nAcompanhe o progresso em tempo real aqui: ${statusUrl}`;
            } else {
                message = `Olá, sua Ordem de Serviço #${order.protocol} foi atualizada. Acompanhe o status aqui: ${statusUrl}`;
            }
        }

        await this.whatsappService.sendMessage(targetNumber, message);

        // Audit Log
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            // Refinement: Try to find a recent status change to merge the WhatsApp log
            const recentStatusChange = await queryRunner.manager.findOne(OrderHistory, {
                where: {
                    orderId: id,
                    actionType: HistoryActionType.STATUS_CHANGE
                },
                order: { createdAt: 'DESC' }
            });

            // Check if it was created in the last 10 minutes (more tolerant)
            const now = new Date();
            const isRecent = recentStatusChange && (now.getTime() - new Date(recentStatusChange.createdAt).getTime()) < 600000;

            console.log(`[WhatsApp Share] Recent Status Change Found: ${!!recentStatusChange}, IsRecent: ${isRecent}`);

            if (isRecent) {
                recentStatusChange.waMsgSent = true;
                recentStatusChange.waMsgContent = message;
                // Append a small indicator to comments if not already there
                if (!recentStatusChange.comments?.includes('[WhatsApp Enviado]')) {
                    recentStatusChange.comments = `${recentStatusChange.comments}\n\n[WhatsApp Enviado]`;
                }
                await queryRunner.manager.save(recentStatusChange);
                console.log(`[WhatsApp Share] Merged into history ID: ${recentStatusChange.id}`);
            } else {
                const history = queryRunner.manager.create(OrderHistory, {
                    orderId: id,
                    actionType: HistoryActionType.INTEGRATION,
                    previousStatus: order.status,
                    newStatus: order.status,
                    comments: `Notificação WhatsApp (${type}) enviada`,
                    waMsgSent: true,
                    waMsgContent: message,
                    userId: userId,
                });
                await queryRunner.manager.save(history);
                console.log(`[WhatsApp Share] Created new integration history entry`);
            }
            await queryRunner.commitTransaction();
        } catch (e) {
            await queryRunner.rollbackTransaction();
            console.error('[WhatsApp Share] Error updating history:', e);
        } finally {
            await queryRunner.release();
        }

        return { success: true, message: 'Mensagem enviada com sucesso!' };
    }

    async lookupBySerial(serial: string): Promise<any | null> {
        if (!serial || serial.length < 3) return null;

        // 1. Try local database
        const local = await this.equipmentsRepository.findOne({
            where: { serialNumber: serial },
            order: { createdAt: 'DESC' }
        });

        if (local) return local;

        // 2. Try external API
        return this.lookupService.lookupExternal(serial);
    }

    async addPart(orderId: string, partData: any): Promise<OrderPart> {
        const part = this.partsRepository.create({
            ...partData,
            orderId,
        } as Partial<OrderPart>);
        return this.partsRepository.save(part);
    }

    async removePart(partId: string): Promise<void> {
        await this.dataSource.getRepository(OrderPart).delete(partId);
    }

    async remove(id: string): Promise<void> {
        const order = await this.findOne(id);
        await this.ordersRepository.softDelete(id);
    }

    async updateEquipment(id: string, data: Partial<OrderEquipment>): Promise<OrderEquipment> {
        const eq = await this.equipmentsRepository.findOne({ where: { id } });
        if (!eq) throw new NotFoundException('Equipamento não encontrado');

        // Remove IDs to avoid accidental primary key changes
        delete (data as any).id;
        delete (data as any).orderId;

        Object.assign(eq, data);
        return this.equipmentsRepository.save(eq);
    }
}
