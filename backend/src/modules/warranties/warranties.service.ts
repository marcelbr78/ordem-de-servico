import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WarrantyReturn, WarrantyReturnStatus } from './entities/warranty-return.entity';
import { WarrantyRefund, RefundStatus } from './entities/warranty-refund.entity';
import { TechnicalMemory } from './entities/technical-memory.entity';
import { OrderService } from '../orders/entities/order-service.entity';
import { OrderHistory, HistoryActionType } from '../orders/entities/order-history.entity';
import {
    CreateWarrantyReturnDto,
    EvaluateWarrantyReturnDto,
    DecideWarrantyReturnDto,
} from './dto/create-warranty-return.dto';
import { CreateWarrantyRefundDto, AuthorizeRefundDto } from './dto/create-warranty-refund.dto';

// Roles permitidas por operação
const ROLES_CREATE  = ['admin', 'technician', 'attendant', 'super_admin'];
const ROLES_EVAL    = ['admin', 'technician', 'super_admin'];
const ROLES_DECIDE  = ['admin', 'super_admin'];
const ROLES_REFUND_AUTH = ['admin', 'super_admin'];

function assertRole(user: any, allowed: string[], action: string) {
    const role = user?.role || '';
    if (!allowed.includes(role)) {
        throw new ForbiddenException(`Sem permissão para ${action}. Requer: ${allowed.join(' | ')}`);
    }
}

@Injectable()
export class WarrantiesService {
    constructor(
        @InjectRepository(WarrantyReturn)
        private returnsRepo: Repository<WarrantyReturn>,
        @InjectRepository(WarrantyRefund)
        private refundsRepo: Repository<WarrantyRefund>,
        @InjectRepository(TechnicalMemory)
        private memoryRepo: Repository<TechnicalMemory>,
        @InjectRepository(OrderService)
        private ordersRepo: Repository<OrderService>,
        @InjectRepository(OrderHistory)
        private historyRepo: Repository<OrderHistory>,
    ) {}

    // ── HELPER: registrar no histórico da OS ─────────────────────────────────

    private async addHistory(
        orderId: string,
        tenantId: string,
        userId: string,
        comments: string,
    ): Promise<void> {
        try {
            const entry = this.historyRepo.create({
                orderId,
                tenantId,
                userId,
                actionType: HistoryActionType.SYSTEM,
                comments,
            });
            await this.historyRepo.save(entry);
        } catch (e) {
            // Não falha o fluxo principal se o histórico não puder ser registrado
            console.warn('[WarrantyHistory] Falha ao registrar histórico:', e?.message);
        }
    }

    // ── WARRANTY RETURNS ─────────────────────────────────────────────────────

    async findAllReturns(tenantId: string, status?: string) {
        const where: any = { tenantId };
        if (status) where.status = status;
        return this.returnsRepo.find({
            where,
            order: { createdAt: 'DESC' },
        });
    }

    async findReturnById(id: string, tenantId: string) {
        const item = await this.returnsRepo.findOne({
            where: { id, tenantId },
            relations: ['originalOrder', 'originalOrder.client', 'originalOrder.equipments'],
        });
        if (!item) throw new NotFoundException('Retorno de garantia não encontrado');
        return item;
    }

    async findReturnsByOrder(orderId: string, tenantId: string) {
        return this.returnsRepo.find({
            where: { originalOrderId: orderId, tenantId },
            order: { createdAt: 'DESC' },
        });
    }

    async createReturn(dto: CreateWarrantyReturnDto, user: any, tenantId: string) {
        assertRole(user, ROLES_CREATE, 'abrir retorno de garantia');

        const order = await this.ordersRepo.findOne({
            where: { id: dto.originalOrderId, tenantId },
            relations: ['client', 'equipments'],
        });
        if (!order) throw new NotFoundException('OS original não encontrada');

        const isWithinWarranty = this.checkWarranty(order);

        const item = this.returnsRepo.create({
            tenantId,
            originalOrderId: dto.originalOrderId,
            defectDescription: dto.defectDescription,
            openedById: user.sub || user.id,
            openedByName: user.name || user.email || '',
            status: WarrantyReturnStatus.PENDING,
            warrantyExpiresAt: order.warrantyExpiresAt,
            isWithinWarranty,
        });

        const saved = await this.returnsRepo.save(item);

        const prazoInfo = isWithinWarranty ? 'dentro do prazo' : '⚠ fora do prazo';
        await this.addHistory(
            dto.originalOrderId,
            tenantId,
            user.sub || user.id,
            `🔄 Retorno de garantia aberto por ${user.name || user.email} (${prazoInfo}). Defeito: "${dto.defectDescription}"`,
        );

        return saved;
    }

    async evaluateReturn(id: string, dto: EvaluateWarrantyReturnDto, user: any, tenantId: string) {
        assertRole(user, ROLES_EVAL, 'registrar avaliação técnica');

        const item = await this.returnsRepo.findOne({ where: { id, tenantId } });
        if (!item) throw new NotFoundException('Retorno não encontrado');

        item.techEvaluation = dto.techEvaluation;
        item.isSameDefect = dto.isSameDefect;
        item.evaluatedById = user.sub || user.id;
        item.evaluatedByName = user.name || user.email || '';
        item.status = WarrantyReturnStatus.EVALUATING;

        const saved = await this.returnsRepo.save(item);

        await this.addHistory(
            item.originalOrderId,
            tenantId,
            user.sub || user.id,
            `🔍 Avaliação técnica registrada por ${user.name || user.email}. Mesmo defeito: ${dto.isSameDefect ? 'Sim' : 'Não'}. "${dto.techEvaluation}"`,
        );

        return saved;
    }

    async decideReturn(id: string, dto: DecideWarrantyReturnDto, user: any, tenantId: string) {
        assertRole(user, ROLES_DECIDE, 'aprovar ou negar garantia');

        const item = await this.returnsRepo.findOne({ where: { id, tenantId } });
        if (!item) throw new NotFoundException('Retorno não encontrado');

        item.warrantyValid = dto.warrantyValid;
        item.authorizedById = user.sub || user.id;
        item.authorizedByName = user.name || user.email || '';
        item.status = dto.warrantyValid
            ? WarrantyReturnStatus.APPROVED
            : WarrantyReturnStatus.DENIED;

        if (dto.warrantyValid) {
            item.resolution = dto.resolution || '';
        } else {
            item.denialReason = dto.denialReason || '';
        }

        const saved = await this.returnsRepo.save(item);

        const msg = dto.warrantyValid
            ? `✅ Garantia APROVADA por ${user.name || user.email}. Resolução: "${dto.resolution}"`
            : `❌ Garantia NEGADA por ${user.name || user.email}. Motivo: "${dto.denialReason}"`;

        await this.addHistory(item.originalOrderId, tenantId, user.sub || user.id, msg);

        return saved;
    }

    async completeReturn(id: string, tenantId: string, user?: any) {
        const item = await this.returnsRepo.findOne({ where: { id, tenantId } });
        if (!item) throw new NotFoundException('Retorno não encontrado');
        if (item.status !== WarrantyReturnStatus.APPROVED) {
            throw new BadRequestException('Apenas retornos aprovados podem ser concluídos');
        }
        item.status = WarrantyReturnStatus.COMPLETED;
        const saved = await this.returnsRepo.save(item);

        const userId = user?.sub || user?.id || 'sistema';
        await this.addHistory(
            item.originalOrderId,
            tenantId,
            userId,
            `🏁 Retorno de garantia concluído por ${user?.name || user?.email || 'sistema'}.`,
        );

        // Auto-salvar na memória técnica se tiver dados suficientes
        if (item.techEvaluation && item.resolution) {
            const order = await this.ordersRepo.findOne({
                where: { id: item.originalOrderId, tenantId },
                relations: ['equipments'],
            });
            const equip = order?.equipments?.[0];
            if (equip) {
                await this.createMemory({
                    tenantId,
                    orderId: item.originalOrderId,
                    orderProtocol: order.protocol,
                    equipmentType: equip.type,
                    equipmentBrand: equip.brand,
                    equipmentModel: equip.model,
                    symptom: item.defectDescription,
                    rootCause: item.techEvaluation,
                    solution: item.resolution,
                    technicianId: item.evaluatedById,
                    technicianName: item.evaluatedByName,
                }, tenantId);
            }
        }

        return saved;
    }

    // ── WARRANTY REFUNDS ─────────────────────────────────────────────────────

    async findAllRefunds(tenantId: string, status?: string) {
        const where: any = { tenantId };
        if (status) where.status = status;
        return this.refundsRepo.find({ where, order: { createdAt: 'DESC' } });
    }

    async createRefund(dto: CreateWarrantyRefundDto, user: any, tenantId: string) {
        assertRole(user, ROLES_CREATE, 'solicitar estorno');

        const order = await this.ordersRepo.findOne({
            where: { id: dto.originalOrderId, tenantId },
        });
        if (!order) throw new NotFoundException('OS não encontrada');

        const item = this.refundsRepo.create({
            tenantId,
            originalOrderId: dto.originalOrderId,
            originalProtocol: order.protocol,
            warrantyReturnId: dto.warrantyReturnId,
            type: dto.type,
            amount: dto.amount,
            reason: dto.reason,
            requestedById: user.sub || user.id,
            requestedByName: user.name || user.email || '',
            status: RefundStatus.REQUESTED,
        });

        const saved = await this.refundsRepo.save(item);

        const valorInfo = dto.amount ? ` — Valor: R$ ${Number(dto.amount).toFixed(2)}` : '';
        await this.addHistory(
            dto.originalOrderId,
            tenantId,
            user.sub || user.id,
            `💰 Estorno solicitado por ${user.name || user.email} (${dto.type}${valorInfo}). Motivo: "${dto.reason}"`,
        );

        return saved;
    }

    async authorizeRefund(id: string, dto: AuthorizeRefundDto, user: any, tenantId: string) {
        assertRole(user, ROLES_REFUND_AUTH, 'autorizar estorno');

        const item = await this.refundsRepo.findOne({ where: { id, tenantId } });
        if (!item) throw new NotFoundException('Estorno não encontrado');

        item.status = dto.approved ? RefundStatus.APPROVED : RefundStatus.DENIED;
        item.authorizedById = user.sub || user.id;
        item.authorizedByName = user.name || user.email || '';
        item.adminNotes = dto.adminNotes;

        if (dto.approved) {
            item.executedAt = new Date();
            item.status = RefundStatus.EXECUTED;
        }

        const saved = await this.refundsRepo.save(item);

        const msg = dto.approved
            ? `✅ Estorno AUTORIZADO por ${user.name || user.email}.${dto.adminNotes ? ` Obs: "${dto.adminNotes}"` : ''}`
            : `❌ Estorno NEGADO por ${user.name || user.email}.${dto.adminNotes ? ` Motivo: "${dto.adminNotes}"` : ''}`;

        await this.addHistory(item.originalOrderId, tenantId, user.sub || user.id, msg);

        return saved;
    }

    // ── TECHNICAL MEMORY ─────────────────────────────────────────────────────

    async searchMemory(tenantId: string, brand?: string, model?: string, symptom?: string) {
        const qb = this.memoryRepo.createQueryBuilder('tm')
            .where('tm.tenantId = :tenantId', { tenantId })
            .orderBy('tm.recurrenceCount', 'DESC')
            .addOrderBy('tm.createdAt', 'DESC')
            .limit(10);

        if (brand) qb.andWhere('tm.equipmentBrand ILIKE :brand', { brand: `%${brand}%` });
        if (model) qb.andWhere('tm.equipmentModel ILIKE :model', { model: `%${model}%` });
        if (symptom) qb.andWhere('tm.symptom ILIKE :symptom', { symptom: `%${symptom}%` });

        return qb.getMany();
    }

    async createMemory(dto: Partial<TechnicalMemory>, tenantId: string) {
        if (dto.equipmentBrand && dto.equipmentModel && dto.symptom) {
            const existing = await this.memoryRepo.findOne({
                where: {
                    tenantId,
                    equipmentBrand: dto.equipmentBrand,
                    equipmentModel: dto.equipmentModel,
                    symptom: dto.symptom,
                },
            });
            if (existing) {
                existing.recurrenceCount += 1;
                if (dto.solution) existing.solution = dto.solution;
                if (dto.rootCause) existing.rootCause = dto.rootCause;
                return this.memoryRepo.save(existing);
            }
        }

        const item = this.memoryRepo.create({ ...dto, tenantId });
        return this.memoryRepo.save(item);
    }

    // ── HELPERS ──────────────────────────────────────────────────────────────

    private checkWarranty(order: OrderService): boolean {
        if (order.warrantyExpiresAt) {
            return new Date() <= new Date(order.warrantyExpiresAt);
        }
        const deliveryDate = order.receiptAt || order.exitDate || order.updatedAt;
        if (!deliveryDate) return false;
        const expiryDate = new Date(deliveryDate);
        expiryDate.setDate(expiryDate.getDate() + (order.warrantyDays || 90));
        return new Date() <= expiryDate;
    }
}
