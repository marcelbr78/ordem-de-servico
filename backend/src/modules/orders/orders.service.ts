import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, Inject, forwardRef, Optional } from '@nestjs/common';
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
import { Transaction, TransactionType } from '../finance/entities/transaction.entity';
import { PlansService } from '../tenants/plans.service';
import { EventDispatcher } from '../events/event-dispatcher.service';
import { AppEvent } from '../events/event-types';
import { ConversationService } from './conversation.service';

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
        private financeService: FinanceService,
        private plansService: PlansService,
        private eventDispatcher: EventDispatcher,
        private conversationService: ConversationService,
        @Optional() private commissionsService: any, // CommissionsService — injetado opcionalmente para evitar circular dep
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

    async create(dto: CreateOrderServiceDto, userId?: string, tenantId?: string): Promise<OrderService> {
        // 0. Verificar limite de OS do plano
        if (tenantId) {
            const currentCount = await this.ordersRepository.count({ where: { tenantId } });
            await this.plansService.checkOsLimit(tenantId, currentCount);
        }

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
                tenantId,
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
                tenantId,
            });
            await queryRunner.manager.save(history);

            await queryRunner.commitTransaction();

            // 5. Notificar WhatsApp (fora da transação para não bloquear)
            this.notifyClient(client, savedOrder);

            // 6. Emitir evento de OS criada
            this.eventDispatcher.emit(AppEvent.WORK_ORDER_CREATED, {
                orderId: savedOrder.id,
                protocol: savedOrder.protocol,
                clientId: dto.clientId,
                technicianId: dto.technicianId,
                tenantId,
                userId,
                timestamp: new Date(),
            });

            return this.findOne(savedOrder.id);

        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw new InternalServerErrorException('Erro ao criar OS: ' + err.message);
        } finally {
            await queryRunner.release();
        }
    }

    async changeStatus(id: string, dto: ChangeStatusDto, userId?: string, tenantId?: string): Promise<OrderService> {
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
            // Calcular data de vencimento da garantia ao entregar
            const warrantyDays = (order as any).warrantyDays ?? 90;
            const warrantyExpiresAt = dto.status === OSStatus.ENTREGUE
                ? new Date(Date.now() + warrantyDays * 86400000)
                : undefined;

            await queryRunner.manager.update(OrderService, id, {
                status: dto.status,
                ...(dto.status === OSStatus.ENTREGUE || dto.status === OSStatus.CANCELADA ? { exitDate: new Date() } : {}),
                ...(warrantyExpiresAt ? { warrantyExpiresAt } : {}),
            });

            console.log(`[OrdersService] Criando registro de histórico para OS ${id}`);
            await queryRunner.manager.insert(OrderHistory, {
                orderId: order.id,
                actionType: HistoryActionType.STATUS_CHANGE,
                previousStatus: previousStatus,
                newStatus: dto.status,
                comments: dto.comments,
                userId: userId,
                tenantId,
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
            }

            if (dto.status === OSStatus.ENTREGUE && dto.paymentAmount && dto.paymentAmount > 0) {
                // 3. Register Financial Transaction for the remaining balance
                console.log(`[OrdersService] Registrando transação financeira para OS ${id}. Banco: ${dto.bankAccountId || 'Nenhum'}`);
                await this.financeService.create({
                    type: TransactionType.INCOME,
                    amount: dto.paymentAmount,
                    category: 'Pagamento de OS',
                    description: `Liquidação da OS #${order.protocol} - Cliente: ${order.client?.nome || 'Cliente'} (${dto.paymentMethod || 'A definir'})`,
                    orderId: order.id,
                    paymentMethod: dto.paymentMethod || 'A definir',
                    bankAccountId: dto.bankAccountId,
                }, queryRunner.manager);
            }

            if (dto.status === OSStatus.CANCELADA) {
                console.log(`[OrdersService] Revertendo estoque para OS ${id}`);
                await this.stockService.reverseMovement(order.id, queryRunner.manager);
            }

            await queryRunner.commitTransaction();

            // Calcular comissão ao entregar (fora da transaction para não bloquear)
            if (dto.status === OSStatus.ENTREGUE || dto.status === OSStatus.FINALIZADA) {
                try {
                    if (this.commissionsService) {
                        await this.commissionsService.calculateForOrder(order.id, tenantId);
                    }
                } catch (commErr) {
                    console.warn(`[OrdersService] Aviso: não foi possível calcular comissão para OS ${id}:`, commErr?.message);
                }
            }
            console.log(`[OrdersService] Transação concluída com sucesso para OS ${id}`);

            // Emitir evento de mudança de status
            this.eventDispatcher.emit(AppEvent.WORK_ORDER_STATUS_CHANGED, {
                orderId: order.id,
                protocol: order.protocol,
                previousStatus,
                newStatus: dto.status,
                comments: dto.comments,
                tenantId,
                userId,
                timestamp: new Date(),
            });

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

    async findAll(withDeleted = false, tenantId?: string): Promise<OrderService[]> {
        return this.ordersRepository.find({
            where: tenantId ? { tenantId } : undefined,
            relations: ['client', 'equipments'],
            order: { entryDate: 'DESC' },
            withDeleted,
        });
    }

    async findAllActive(tenantId?: string): Promise<OrderService[]> {
        console.log('Fetching all active orders for monitor...');
        const qb = this.ordersRepository.createQueryBuilder('order')
            .leftJoinAndSelect('order.client', 'client')
            .leftJoinAndSelect('order.equipments', 'equipments')
            .where('order.status NOT IN (:...statuses)', {
                statuses: [OSStatus.ENTREGUE, OSStatus.CANCELADA]
            });

        if (tenantId) {
            qb.andWhere('order.tenantId = :tenantId', { tenantId });
        }

        const orders = await qb
            .orderBy('CASE WHEN order.priority = :urgente THEN 1 WHEN order.priority = :alta THEN 2 WHEN order.priority = :normal THEN 3 ELSE 4 END', 'ASC')
            .addOrderBy('order.entryDate', 'ASC')
            .setParameter('urgente', OSPriority.URGENTE)
            .setParameter('alta', OSPriority.ALTA)
            .setParameter('normal', OSPriority.NORMAL)
            .getMany();

        console.log(`Found ${orders.length} active orders.`);
        return orders;
    }

    async findByClient(clientId: string, tenantId?: string): Promise<OrderService[]> {
        return this.ordersRepository.find({
            where: tenantId ? { clientId, tenantId } : { clientId },
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

                // Get public URL for the link
                const settings = await this.settingsService.findAll();
                const publicUrl = settings.find(s => s.key === 'company_url')?.value || '';
                const frontendUrl = publicUrl || process.env.FRONTEND_URL || 'https://os4u.com.br';
                const statusUrl = `${frontendUrl.replace(/\/+$/, '')}/status/${order.id}`;

                await this.whatsappService.sendOSCreated(contact.numero, order.protocol, device, statusUrl);
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
        const storeName = settings.find(s => s.key === 'store_name' || s.key === 'company_name')?.value || 'Nossa Loja';
        const storePhone = settings.find(s => s.key === 'company_phone' || s.key === 'store_phone')?.value || '';
        const publicUrl = settings.find(s => s.key === 'company_url')?.value || '';
        const clientName = (order.client.nome || 'Cliente').split(' ')[0];
        const device = order.equipments?.[0] ? `${order.equipments[0].type} ${order.equipments[0].model}` : 'seu equipamento';

        // Simulating the message construction from frontend
        let message = customMessage?.trim() || '';
        console.log(`[WhatsApp Share] Final Message Length: ${message.length}`);

        if (!message) {
            const frontendUrl = publicUrl || origin || process.env.FRONTEND_URL || 'https://os4u.com.br';
            const statusUrl = `${frontendUrl.replace(/\/+$/, '')}/status/${order.id}`;

            // Calculate total from parts if finalValue is not set
            let total = Number(order.finalValue) || 0;
            if (total === 0 && order.parts?.length > 0) {
                total = order.parts.reduce((acc, p) => acc + (Number(p.unitPrice) * p.quantity), 0);
            }
            const totalFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total);

            const buttons = [
                { type: 'url', displayText: '🔍 Ver Status', url: statusUrl }
            ];

            let title = 'ATUALIZAÇÃO DE OS';
            let description = '';

            if (type === 'entry') {
                title = '📦 OS ABERTA';
                const defect = order.equipments?.[0]?.reportedDefect || order.reportedDefect || 'não informado';
                description = `Olá ${clientName}, confirmamos a entrada do ${device} na ${storeName}.\n\n📄 *Protocolo:* ${order.protocol}\n🛠 *Defeito:* ${defect}`;
            } else if (type === 'exit' || (type === 'update' && order.status === OSStatus.FINALIZADA)) {
                title = '✅ SERVIÇO CONCLUÍDO';
                const lastComment = order.history?.find(h => h.comments && h.comments.length > 5)?.comments || order.history?.[0]?.comments || 'Serviço concluído.';
                description = `Olá ${clientName}, o serviço no ${device} foi finalizado!\n\n📄 *Protocolo:* ${order.protocol}\n💰 *Total:* ${totalFormatted}\n💬 *Observações:* ${lastComment}`;
            } else if (type === 'update') {
                const latestHistory = order.history?.find(h => h.actionType === HistoryActionType.STATUS_CHANGE) || order.history?.[0];
                const statusLabel = latestHistory?.newStatus ? latestHistory.newStatus.toUpperCase().replace('_', ' ') : order.status.toUpperCase().replace('_', ' ');
                const comment = latestHistory?.comments || 'Status atualizado.';

                description = `Olá ${clientName}, informamos que o status da sua Ordem de Serviço #${order.protocol} (${device}) foi atualizado para: *${statusLabel}*.\n\n💬 *Observações:* ${comment}`;

                if (order.status === OSStatus.AGUARDANDO_APROVACAO && storePhone) {
                    const phone = storePhone.replace(/\D/g, '');
                    const approveMsg = encodeURIComponent(`Olá, estou acompanhando minha OS #${order.protocol} (${device}) e selecionei: ✅ APROVADO.`);
                    const rejectMsg = encodeURIComponent(`Olá, estou acompanhando minha OS #${order.protocol} (${device}) e selecionei: ❌ NÃO APROVADO.`);

                    buttons.push({ type: 'url', displayText: '✅ Aprovar', url: `https://wa.me/${phone}?text=${approveMsg}` });
                    buttons.push({ type: 'url', displayText: '❌ Rejeitar', url: `https://wa.me/${phone}?text=${rejectMsg}` });
                }
            } else {
                description = `Olá, sua Ordem de Serviço #${order.protocol} foi atualizada.`;
            }

            await this.whatsappService.sendButtons(targetNumber, title, description, buttons, storeName);
        } else {
            await this.whatsappService.sendMessage(targetNumber, message);
        }

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

        // Gravar na conversa da OS para auditoria
        try {
            await this.conversationService.recordOutbound({
                orderId: id,
                tenantId: (order as any).tenantId,
                content: message || `[Mensagem automática - tipo: ${type}]`,
                userId,
                senderName: 'Sistema',
            });
        } catch (e) {
            console.warn(`[Conversation] Falha ao gravar outbound: ${e?.message}`);
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

        delete (data as any).id;
        delete (data as any).orderId;

        Object.assign(eq, data);
        return this.equipmentsRepository.save(eq);
    }

    async getWarrantyOrders(tenantId?: string): Promise<any[]> {
        const now = new Date();
        const thirtyDaysLater = new Date(now.getTime() + 30 * 86400000);

        const orders = await this.ordersRepository.find({
            where: tenantId ? { tenantId, status: OSStatus.ENTREGUE } : { status: OSStatus.ENTREGUE },
            relations: ['client', 'equipments'],
            order: { warrantyExpiresAt: 'ASC' },
        });

        return orders
            .filter(o => (o as any).warrantyExpiresAt)
            .map(o => {
                const exp = new Date((o as any).warrantyExpiresAt);
                const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / 86400000);
                const isExpired = daysLeft < 0;
                const isExpiringSoon = !isExpired && daysLeft <= 30;
                return {
                    id: o.id,
                    protocol: o.protocol,
                    clientName: (o as any).client?.nome || '—',
                    clientPhone: (o as any).client?.contatos?.[0]?.numero || '—',
                    equipment: (o as any).equipments?.[0]
                        ? `${(o as any).equipments[0].brand} ${(o as any).equipments[0].model}`
                        : '—',
                    exitDate: o.exitDate,
                    warrantyExpiresAt: (o as any).warrantyExpiresAt,
                    warrantyDays: (o as any).warrantyDays ?? 90,
                    daysLeft,
                    isExpired,
                    isExpiringSoon,
                };
            });
    }

    async getDashboardStats(tenantId?: string): Promise<any> {
        const where = tenantId ? { tenantId } : undefined;

        const [all, aberta, em_diagnostico, aguardando_peca, em_reparo, finalizada, entregue, cancelada] = await Promise.all([
            this.ordersRepository.count({ where }),
            this.ordersRepository.count({ where: { ...where, status: OSStatus.ABERTA } }),
            this.ordersRepository.count({ where: { ...where, status: OSStatus.EM_DIAGNOSTICO } }),
            this.ordersRepository.count({ where: { ...where, status: OSStatus.AGUARDANDO_PECA } }),
            this.ordersRepository.count({ where: { ...where, status: OSStatus.EM_REPARO } }),
            this.ordersRepository.count({ where: { ...where, status: OSStatus.FINALIZADA } }),
            this.ordersRepository.count({ where: { ...where, status: OSStatus.ENTREGUE } }),
            this.ordersRepository.count({ where: { ...where, status: OSStatus.CANCELADA } }),
        ]);

        // Ordens recentes (últimas 10)
        const recent = await this.ordersRepository.find({
            where,
            order: { entryDate: 'DESC' },
            take: 10,
            relations: ['client', 'equipments'],
        });

        // Faturamento do mês atual
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const repo = this.dataSource.getRepository(Transaction);
        const monthlyTransactions = await repo
            .createQueryBuilder('t')
            .where(tenantId ? 't.tenantId = :tenantId' : '1=1', { tenantId })
            .andWhere('t.type = :type', { type: 'income' })
            .andWhere('t.createdAt >= :start', { start: startOfMonth })
            .getMany()
            .catch(() => []);

        const monthlyRevenue = (monthlyTransactions as any[]).reduce((sum: number, t: any) => sum + Number(t.amount), 0);

        // ── Dados do dia de hoje ─────────────────────────────
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const [todayOpened, todayDelivered] = await Promise.all([
            this.ordersRepository.count({ where: { ...where, entryDate: { $gte: today } as any } }).catch(() => 0),
            this.ordersRepository.count({ where: { ...where, exitDate: { $gte: today } as any } }).catch(() => 0),
        ]);

        // ── OS urgentes atrasadas (> 48h abertas sem mover) ──
        const urgentThreshold = new Date(Date.now() - 48 * 3600000);
        const urgentOrders = await this.ordersRepository.find({
            where: { ...where, status: OSStatus.ABERTA },
            relations: ['client', 'equipments'],
            take: 5,
        }).then(orders => orders.filter(o => new Date(o.entryDate) < urgentThreshold));

        // ── Metas do mês ────────────────────────────────────
        const [prevMonthStart] = [new Date(now.getFullYear(), now.getMonth() - 1, 1)];
        const prevMonthTransactions = await repo
            .createQueryBuilder('t')
            .where(tenantId ? 't.tenantId = :tenantId' : '1=1', { tenantId })
            .andWhere('t.type = :type', { type: 'INCOME' })
            .andWhere('t.createdAt >= :start', { start: prevMonthStart })
            .andWhere('t.createdAt < :end', { end: startOfMonth })
            .getMany().catch(() => []);
        const prevMonthRevenue = (prevMonthTransactions as any[]).reduce((s: number, t: any) => s + Number(t.amount), 0);

        // ── Top técnicos (por OS entregues no mês) ──────────
        const deliveredMonth = await this.ordersRepository.find({
            where: { ...where, status: OSStatus.ENTREGUE },
            select: ['technicianId', 'id'],
        });
        const techMap: Record<string, number> = {};
        for (const o of deliveredMonth) {
            if (o.technicianId) techMap[o.technicianId] = (techMap[o.technicianId] || 0) + 1;
        }

        // ── Próximos agendamentos (scheduler) ───────────────
        let upcomingSchedule: any[] = [];
        try {
            const schedRepo = this.dataSource.getRepository('Appointment');
            upcomingSchedule = await schedRepo.find({
                where: { startAt: { $gte: new Date() } as any },
                order: { startAt: 'ASC' },
                take: 3,
            });
        } catch {}

        // ── SLA — OS abertas há muito tempo ─────────────────
        const allActive = await this.ordersRepository.find({
            where,
            select: ['id', 'protocol', 'status', 'priority', 'entryDate', 'technicianId'],
            relations: ['client', 'equipments'],
        }).then(os => os.filter(o =>
            [OSStatus.ABERTA, OSStatus.EM_DIAGNOSTICO, OSStatus.AGUARDANDO_PECA, OSStatus.EM_REPARO, OSStatus.TESTES].includes(o.status as OSStatus)
        ));

        const slaViolations = allActive
            .map(o => ({
                id: o.id, protocol: o.protocol, status: o.status, priority: o.priority,
                clientName: (o as any).client?.nome || '—',
                equipment: (o as any).equipments?.[0] ? `${(o as any).equipments[0].brand || ''} ${(o as any).equipments[0].model || ''}`.trim() : '—',
                hoursOpen: Math.floor((Date.now() - new Date(o.entryDate).getTime()) / 3600000),
            }))
            .filter(o => o.hoursOpen > 24)
            .sort((a, b) => b.hoursOpen - a.hoursOpen)
            .slice(0, 8);

        // ── Faturamento por dia (últimos 7 dias) ─────────────
        const last7days: Array<{ date: string; revenue: number }> = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);
            const dEnd = new Date(d);
            dEnd.setHours(23, 59, 59, 999);
            const dayTx = monthlyTransactions.filter((t: any) => {
                const td = new Date(t.createdAt);
                return td >= d && td <= dEnd;
            });
            last7days.push({
                date: d.toISOString().slice(0, 10),
                revenue: dayTx.reduce((s: number, t: any) => s + Number(t.amount), 0),
            });
        }

        return {
            total: all,
            byStatus: { aberta, em_diagnostico, aguardando_peca, em_reparo, finalizada, entregue, cancelada },
            recentOrders: recent.map(o => ({
                id: o.id, protocol: o.protocol, status: o.status, priority: o.priority,
                clientName: (o as any).client?.nome || '—',
                equipmentBrand: (o as any).equipments?.[0]?.brand || (o as any).equipments?.[0]?.marca || '—',
                equipmentModel: (o as any).equipments?.[0]?.model || (o as any).equipments?.[0]?.modelo || '—',
                total: o.finalValue || o.estimatedValue || 0,
                createdAt: (o as any).entryDate || (o as any).createdAt,
            })),
            monthlyRevenue,
            prevMonthRevenue,
            todayOpened,
            todayDelivered,
            slaViolations,
            last7days,
            urgentCount: urgentOrders.length,
        };
    }
}
