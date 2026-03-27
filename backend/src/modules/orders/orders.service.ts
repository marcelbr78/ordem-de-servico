import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
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
import { ClientsService } from '../clients/clients.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { SettingsService } from '../settings/settings.service';
import { LookupService } from './lookup.service';
import { Transaction } from '../finance/entities/transaction.entity';
import { PlansService } from '../tenants/plans.service';
import { EventDispatcher } from '../events/event-dispatcher.service';
import { AppEvent } from '../events/event-types';
import { OrderNotificationService } from './order-notification.service';

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
        private clientsService: ClientsService,
        private cloudinaryService: CloudinaryService,
        private settingsService: SettingsService,
        private lookupService: LookupService,
        private plansService: PlansService,
        private eventDispatcher: EventDispatcher,
        private notificationService: OrderNotificationService,
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
                expectedDeliveryDate: dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : null,
                observations: dto.observations || null,
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
            this.notificationService.notifyOnCreate(client, savedOrder);

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
        const order = await this.findOne(id, tenantId);
        // Validacao de fluxo removida a pedido (Modo Liberdade)

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const previousStatus = order.status;
            const warrantyDays = (order as any).warrantyDays ?? 90;

            await this._applyStatusUpdate(queryRunner, id, dto.status, warrantyDays);
            await this._recordStatusHistory(queryRunner, order.id, dto, previousStatus, userId, tenantId);
            if (dto.status === OSStatus.FINALIZADA) {
                await this._applyFinalValue(queryRunner, order.id);
            }

            await queryRunner.commitTransaction();

            console.log(`[OrdersService] Transação concluída com sucesso para OS ${id}`);
            this._emitStatusEvent(order, dto, previousStatus, tenantId, userId);

            return this.findOne(id, tenantId);
        } catch (err) {
            await queryRunner.rollbackTransaction();
            console.error(`[OrdersService] ERRO ao mudar status da OS ${id}:`, err.message);
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    private async _applyStatusUpdate(
        qr: QueryRunner,
        id: string,
        newStatus: OSStatus,
        warrantyDays: number,
    ): Promise<void> {
        const warrantyExpiresAt = newStatus === OSStatus.ENTREGUE
            ? new Date(Date.now() + warrantyDays * 86400000)
            : undefined;

        await qr.manager.update(OrderService, id, {
            status: newStatus,
            ...(newStatus === OSStatus.ENTREGUE || newStatus === OSStatus.CANCELADA ? { exitDate: new Date() } : {}),
            ...(warrantyExpiresAt ? { warrantyExpiresAt } : {}),
        });
    }

    private async _recordStatusHistory(
        qr: QueryRunner,
        orderId: string,
        dto: ChangeStatusDto,
        previousStatus: OSStatus,
        userId?: string,
        tenantId?: string,
    ): Promise<void> {
        console.log(`[OrdersService] Criando registro de histórico para OS ${orderId}`);
        await qr.manager.insert(OrderHistory, {
            orderId,
            actionType: HistoryActionType.STATUS_CHANGE,
            previousStatus,
            newStatus: dto.status,
            comments: dto.comments,
            userId,
            tenantId,
        });
    }

    /** Calcula e persiste o valor final da OS com base nas peças.
     *  Mantido dentro da transaction do changeStatus — não move para evento. */
    private async _applyFinalValue(qr: QueryRunner, orderId: string): Promise<void> {
        const parts = await qr.manager.find(OrderPart, { where: { orderId } });
        const totalValue = parts.reduce((acc, p) => acc + (Number(p.unitPrice) * p.quantity), 0);
        await qr.manager.update(OrderService, orderId, { finalValue: totalValue });
    }


    private _emitStatusEvent(
        order: OrderService,
        dto: ChangeStatusDto,
        previousStatus: OSStatus,
        tenantId?: string,
        userId?: string,
    ): void {
        this.eventDispatcher.emit(AppEvent.WORK_ORDER_STATUS_CHANGED, {
            orderId: order.id,
            protocol: order.protocol,
            previousStatus,
            newStatus: dto.status,
            comments: dto.comments,
            tenantId,
            userId,
            timestamp: new Date(),
            // Dados de pagamento — disponíveis para o FinanceEventListener
            paymentAmount: dto.paymentAmount,
            paymentMethod: dto.paymentMethod,
            bankAccountId: dto.bankAccountId,
            customerName: order.client?.nome,
        });
    }

    async recordPublicAccess(orderId: string): Promise<void> {
        try {
            const order = await this.ordersRepository.findOne({ where: { id: orderId } });
            if (!order) return;
            // Skip if last access record was within the last 30 minutes (avoid spam)
            const recent = await this.historyRepository.findOne({
                where: { orderId, actionType: HistoryActionType.SYSTEM, comments: '👁️ Cliente visualizou o link público' },
                order: { createdAt: 'DESC' },
            });
            if (recent) {
                const minutesAgo = (Date.now() - new Date(recent.createdAt).getTime()) / 60000;
                if (minutesAgo < 30) return;
            }
            await this.historyRepository.insert({
                orderId,
                tenantId: (order as any).tenantId,
                actionType: HistoryActionType.SYSTEM,
                comments: '👁️ Cliente visualizou o link público',
            });
        } catch { /* silent — não bloquear a resposta */ }
    }

    async update(id: string, dto: UpdateOrderServiceDto, tenantId?: string): Promise<OrderService> {
        const order = await this.findOne(id, tenantId);
        const updated = Object.assign(order, dto);
        await this.ordersRepository.save(updated);
        return this.findOne(id, tenantId);
    }

    async findAll(withDeleted = false, tenantId?: string): Promise<OrderService[]> {
        return this.ordersRepository.find({
            where: tenantId ? { tenantId } : undefined,
            relations: ['client', 'equipments', 'parts', 'services'],
            order: { entryDate: 'DESC' },
            withDeleted,
        });
    }

    async findAllActive(tenantId?: string): Promise<OrderService[]> {
        console.log('Fetching all active orders for monitor...');
        const qb = this.ordersRepository.createQueryBuilder('order')
            .leftJoinAndSelect('order.client', 'client')
            .leftJoinAndSelect('order.equipments', 'equipments')
            .leftJoinAndSelect('order.parts', 'parts')
            .leftJoinAndSelect('order.services', 'services')
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

    async findOne(idOrProtocol: string, tenantId?: string): Promise<OrderService> {
        // Check if it's a UUID
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrProtocol);

        const baseWhere = isUuid ? { id: idOrProtocol } : { protocol: idOrProtocol };
        const where = tenantId ? { ...baseWhere, tenantId } : baseWhere;

        const order = await this.ordersRepository.findOne({
            where,
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


    async addPhoto(orderId: string, file: Express.Multer.File, tenantId?: string): Promise<OrderPhoto> {
        const order = await this.findOne(orderId, tenantId);

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

    async removePhoto(photoId: string, tenantId?: string): Promise<void> {
        const photo = await this.photoRepository.findOne({ where: { id: photoId } });
        if (!photo) {
            throw new NotFoundException('Foto não encontrada');
        }
        await this.findOne(photo.orderId, tenantId); // valida ownership via OS-pai

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
        tenantId?: string;
    }): Promise<{ success: boolean; message?: string }> {
        const { tenantId } = options;
        if (!tenantId) throw new UnauthorizedException('Tenant obrigat\u00f3rio');

        const order = await this.findOne(id, tenantId);

        // Resolver lógica de domínio da OS ANTES de delegar ao notification service
        const settings = await this.settingsService.findAll();
        const storePhone = settings.find(s => s.key === 'company_phone' || s.key === 'store_phone')?.value || '';

        // Se type='update' mas OS já está finalizada, tratar como mensagem de saída
        const effectiveType = options.type === 'update' && order.status === OSStatus.FINALIZADA
            ? 'exit'
            : options.type;

        // Botões de aprovação: decisão de domínio fica aqui, não no notification service
        const addApprovalButtons = effectiveType === 'update' && order.status === OSStatus.AGUARDANDO_APROVACAO;

        return this.notificationService.notifyOrderShare(order, {
            ...options,
            type: effectiveType,
            addApprovalButtons,
            approvalStorePhone: addApprovalButtons ? storePhone : undefined,
        });
    }

    async lookupBySerial(serial: string, tenantId?: string): Promise<any | null> {
        if (!serial || serial.length < 3) return null;

        // 1. Try local database (scoped to tenant when provided)
        const where: any = { serialNumber: serial };
        if (tenantId) where.tenantId = tenantId;
        const local = await this.equipmentsRepository.findOne({
            where,
            order: { createdAt: 'DESC' }
        });

        if (local) return local;

        // 2. Try external API
        return this.lookupService.lookupExternal(serial);
    }

    async addPart(orderId: string, partData: any, tenantId?: string): Promise<OrderPart> {
        await this.findOne(orderId, tenantId); // valida ownership antes de inserir
        const part = this.partsRepository.create({
            ...partData,
            orderId,
        } as Partial<OrderPart>);
        return this.partsRepository.save(part);
    }

    async removePart(partId: string, tenantId?: string): Promise<void> {
        const part = await this.partsRepository.findOne({ where: { id: partId } });
        if (!part) throw new NotFoundException('Peça não encontrada');
        await this.findOne(part.orderId, tenantId); // valida ownership via OS-pai
        await this.dataSource.getRepository(OrderPart).delete(partId);
    }

    async remove(id: string, tenantId?: string): Promise<void> {
        await this.findOne(id, tenantId); // valida ownership
        await this.ordersRepository.softDelete(tenantId ? { id, tenantId } : id);
    }

    async updateEquipment(id: string, data: Partial<OrderEquipment>, tenantId?: string): Promise<OrderEquipment> {
        const eq = await this.equipmentsRepository.findOne({ where: { id } });
        if (!eq) throw new NotFoundException('Equipamento não encontrado');
        await this.findOne(eq.orderId, tenantId); // valida ownership via OS-pai

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
