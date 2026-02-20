import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner, Like } from 'typeorm';
import { OrderService, OSStatus } from './entities/order-service.entity';
import { OrderEquipment } from './entities/order-equipment.entity';
import { OrderPart } from './entities/order-part.entity';
import { OrderHistory, HistoryActionType } from './entities/order-history.entity';
import { OrderPhoto, PhotoCategory } from './entities/order-photo.entity';
import { CreateOrderServiceDto } from './dto/create-order-service.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { ClientsService } from '../clients/clients.service';
import { StockService } from '../inventory/stock.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { SettingsService } from '../settings/settings.service';

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
        private settingsService: SettingsService
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
            order.status = dto.status;

            if (dto.status === OSStatus.ENTREGUE || dto.status === OSStatus.CANCELADA) {
                order.exitDate = new Date();
            }

            await queryRunner.manager.save(order);

            const history = queryRunner.manager.create(OrderHistory, {
                orderId: order.id,
                actionType: HistoryActionType.STATUS_CHANGE,
                previousStatus: previousStatus,
                newStatus: dto.status,
                comments: dto.comments,
                userId: userId,
            });
            await queryRunner.manager.save(history);

            // --- STOCK CORE INTEGRATION ---
            if (dto.status === OSStatus.FINALIZADA) {
                const parts = await queryRunner.manager.find(OrderPart, { where: { orderId: order.id } });

                if (parts.length > 0) {
                    await this.stockService.consumeStock(
                        order.id,
                        parts.map(p => ({ productId: p.productId, quantity: p.quantity })),
                        queryRunner.manager
                    );
                }
            }

            await queryRunner.commitTransaction();

            if (dto.status === OSStatus.CANCELADA) {
                await this.stockService.reverseMovement(order.id);
            }

            // Notificar cliente se necessário (implementar depois)

            return this.findOne(id);
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    async findAll(withDeleted = false): Promise<OrderService[]> {
        return this.ordersRepository.find({
            relations: ['client', 'equipments'],
            order: { entryDate: 'DESC' },
            withDeleted,
        });
    }

    async findByClient(clientId: string): Promise<OrderService[]> {
        return this.ordersRepository.find({
            where: { clientId },
            relations: ['equipments'],
            order: { entryDate: 'DESC' },
        });
    }

    async findOne(id: string): Promise<OrderService> {
        const order = await this.ordersRepository.findOne({
            where: { id },
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
        const contact = client.contatos.find(c => c.tipo === 'whatsapp' && c.principal)
            || client.contatos.find(c => c.tipo === 'whatsapp');

        if (contact) {
            // await this.whatsappService.sendOSCreated(...)
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
            const contact = order.client?.contatos?.find(c => c.principal && c.numero)
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
            // Construct status URL - WE NEED IT ABSOLUTE for WhatsApp
            const frontendUrl = origin || process.env.FRONTEND_URL || 'http://localhost:5173';
            const statusUrl = `${frontendUrl}/status/${order.id}`;

            if (type === 'entry') {
                message = `Ol\u00e1 ${clientName}, confirmamos a entrada do ${device} na ${storeName}.\n\n\ud83d\udcc4 *Protocolo:* ${order.protocol}\n\ud83d\udee0 *Defeito:* ${order.reportedDefect || 'N\u00e3o informado'}\n\nAcompanhe o status em tempo real aqui: ${statusUrl}`;
            } else if (type === 'exit') {
                const total = order.finalValue || order.estimatedValue || 0;
                const totalFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total);
                const statusLabel = order.status.toUpperCase().replace('_', ' ');

                message = `Ol\u00e1 ${clientName}, o servi\u00e7o no ${device} foi finalizado!\n\n\ud83d\udcc4 *Protocolo:* ${order.protocol}\n\u2705 *Status:* ${statusLabel}\n\ud83d\udcb0 *Total:* ${totalFormatted}\n\nConfira os detalhes e o laudo t\u00e9cnico aqui: ${statusUrl}`;
            } else {
                message = `Ol\u00e1, sua Ordem de Servi\u00e7o #${order.protocol} foi atualizada. Acompanhe o status aqui: ${statusUrl}`;
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

    async remove(id: string): Promise<void> {
        const order = await this.findOne(id);
        await this.ordersRepository.softDelete(id);
    }
}
