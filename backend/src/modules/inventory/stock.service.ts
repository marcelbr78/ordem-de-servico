import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner, EntityManager } from 'typeorm';
import { StockBalance } from './entities/stock-balance.entity';
import { StockMovement, MovementType } from './entities/stock-movement.entity';
import { Product } from './entities/product.entity';

@Injectable()
export class StockService {
    constructor(
        @InjectRepository(StockBalance)
        private balanceRepo: Repository<StockBalance>,
        @InjectRepository(StockMovement)
        private movementRepo: Repository<StockMovement>,
        private dataSource: DataSource,
    ) { }

    // Helper to get balance or create if not exists
    private async getBalance(manager: EntityManager, productId: string): Promise<StockBalance> {
        let balance = await manager.findOne(StockBalance, { where: { productId } });
        if (!balance) {
            balance = manager.create(StockBalance, { productId, quantity: 0 });
            await manager.save(balance);
        }
        return balance;
    }

    async addStock(orderId: string, items: { productId: string, quantity: number, cost: number }[], manager?: EntityManager) {
        const run = async (em: EntityManager) => {
            for (const item of items) {
                const balance = await this.getBalance(em, item.productId);
                const balanceBefore = balance.quantity;

                balance.quantity += item.quantity;
                await em.save(balance);

                const movement = em.create(StockMovement, {
                    productId: item.productId,
                    orderId,
                    type: MovementType.ENTRY,
                    quantity: item.quantity,
                    unitCost: item.cost,
                    balanceBefore,
                    balanceAfter: balance.quantity,
                });
                await em.save(movement);
            }
        };

        if (manager) await run(manager);
        else await this.dataSource.transaction(run);
    }

    async consumeStock(orderId: string, items: { productId: string, quantity: number }[], manager?: EntityManager) {
        const run = async (em: EntityManager) => {
            for (const item of items) {
                const product = await em.findOne(Product, { where: { id: item.productId } });
                const balance = await this.getBalance(em, item.productId);
                if (!product?.allowNegativeStock && balance.quantity < item.quantity) {
                    throw new BadRequestException(`Estoque insuficiente para o produto ${item.productId}`);
                }

                const balanceBefore = balance.quantity;
                balance.quantity -= item.quantity;
                await em.save(balance);

                const movement = em.create(StockMovement, {
                    productId: item.productId,
                    orderId,
                    type: MovementType.EXIT,
                    quantity: item.quantity,
                    unitCost: 0, // Cost is irrelevant for exit or should use average cost? Kept 0 for now or fetch from product.
                    balanceBefore,
                    balanceAfter: balance.quantity,
                });
                await em.save(movement);
            }
        };

        if (manager) await run(manager);
        else await this.dataSource.transaction(run);
    }

    async reverseMovement(orderId: string, manager?: EntityManager) {
        const run = async (em: EntityManager) => {
            const movements = await em.find(StockMovement, { where: { orderId } });

            for (const mov of movements) {
                // Determine reverse type
                let newType: MovementType;
                let multiplier: number; // +1 to add back (reverse exit), -1 to remove (reverse entry)

                if (mov.type === MovementType.EXIT) {
                    newType = MovementType.REVERSE_EXIT;
                    multiplier = 1;
                } else if (mov.type === MovementType.ENTRY) {
                    newType = MovementType.REVERSE_ENTRY;
                    multiplier = -1;
                } else {
                    continue; // Already reversed or unknown
                }

                const balance = await this.getBalance(em, mov.productId);
                const balanceBefore = balance.quantity;
                balance.quantity += (mov.quantity * multiplier);
                await em.save(balance);

                const reverseMov = em.create(StockMovement, {
                    productId: mov.productId,
                    orderId,
                    type: newType,
                    quantity: mov.quantity,
                    unitCost: mov.unitCost,
                    balanceBefore,
                    balanceAfter: balance.quantity,
                });
                await em.save(reverseMov);
            }
        };

        if (manager) await run(manager);
        else await this.dataSource.transaction(run);
    }

    // ── Entrada manual ────────────────────────────────────────
    async manualEntry(productId: string, quantity: number, cost?: number, reason?: string, supplierId?: string, invoiceNumber?: string, tenantId?: string) {
        return this.dataSource.transaction(async em => {
            const balance = await this.getBalance(em, productId);
            const before = balance.quantity;
            balance.quantity += quantity;
            await em.save(balance);
            const mv = em.create(StockMovement, {
                productId, tenantId, orderId: null,
                type: MovementType.ENTRY, quantity,
                unitCost: cost || 0, balanceBefore: before, balanceAfter: balance.quantity,
            });
            (mv as any).reason = reason || 'Entrada manual';
            (mv as any).invoiceNumber = invoiceNumber;
            (mv as any).supplierId = supplierId;
            await em.save(mv);
            return em.findOne(require('./entities/product.entity').Product, { where: { id: productId }, relations: ['balance'] });
        });
    }

    // ── Saída manual ──────────────────────────────────────────
    async manualExit(productId: string, quantity: number, reason?: string, tenantId?: string) {
        return this.dataSource.transaction(async em => {
            const product = await em.findOne(require('./entities/product.entity').Product, { where: { id: productId } });
            const balance = await this.getBalance(em, productId);
            const before = balance.quantity;
            if (product && (product as any).allowNegativeStock) {
                balance.quantity = balance.quantity - quantity;
            } else {
                balance.quantity = Math.max(0, balance.quantity - quantity);
            }
            await em.save(balance);
            const mv = em.create(StockMovement, {
                productId, tenantId, orderId: null,
                type: MovementType.EXIT, quantity,
                unitCost: 0, balanceBefore: before, balanceAfter: balance.quantity,
            });
            (mv as any).reason = reason || 'Saída manual';
            await em.save(mv);
            return em.findOne(require('./entities/product.entity').Product, { where: { id: productId }, relations: ['balance'] });
        });
    }

    // ── Ajuste de inventário ──────────────────────────────────
    async adjust(productId: string, newQuantity: number, reason?: string, tenantId?: string) {
        return this.dataSource.transaction(async em => {
            const balance = await this.getBalance(em, productId);
            const before = balance.quantity;
            const diff = newQuantity - before;
            balance.quantity = newQuantity;
            await em.save(balance);
            const mv = em.create(StockMovement, {
                productId, tenantId, orderId: null,
                type: diff >= 0 ? MovementType.ENTRY : MovementType.EXIT,
                quantity: Math.abs(diff),
                unitCost: 0, balanceBefore: before, balanceAfter: newQuantity,
            });
            (mv as any).reason = reason || `Ajuste de inventário (${diff >= 0 ? '+' : ''}${diff})`;
            await em.save(mv);
            return em.findOne(require('./entities/product.entity').Product, { where: { id: productId }, relations: ['balance'] });
        });
    }

    // ── Entrada por nota de compra (lote) ─────────────────────
    async purchaseEntry(items: Array<{ productId: string; quantity: number; cost: number }>, invoiceNumber?: string, supplierId?: string, tenantId?: string) {
        return this.dataSource.transaction(async em => {
            const results = [];
            for (const item of items) {
                const balance = await this.getBalance(em, item.productId);
                const before = balance.quantity;
                balance.quantity += item.quantity;
                await em.save(balance);
                const mv = em.create(StockMovement, {
                    productId: item.productId, tenantId, orderId: null,
                    type: MovementType.ENTRY, quantity: item.quantity,
                    unitCost: item.cost, balanceBefore: before, balanceAfter: balance.quantity,
                });
                (mv as any).reason = `Compra${invoiceNumber ? ` NF ${invoiceNumber}` : ''}`;
                (mv as any).invoiceNumber = invoiceNumber;
                (mv as any).supplierId = supplierId;
                await em.save(mv);
                // Atualizar custo médio no produto
                const product = await em.findOne(Product, { where: { id: item.productId } });
                if (product) {
                    const oldCost = Number((product as any).priceCost) || 0;
                    const oldQty = Math.max(0, before);
                    const newAvgCost = oldQty === 0 ? item.cost : ((oldCost * oldQty) + (item.cost * item.quantity)) / (oldQty + item.quantity);
                    (product as any).priceCost = newAvgCost;
                    await em.save(product);
                }
                results.push({ productId: item.productId, newBalance: balance.quantity });
            }
            return results;
        });
    }

    // ── Listar movimentações ──────────────────────────────────
    async getMovements(productId?: string, from?: string, to?: string, tenantId?: string) {
        const qb = this.movementRepo.createQueryBuilder('m')
            .leftJoinAndSelect('m.product', 'p')
            .orderBy('m.createdAt', 'DESC')
            .take(200);
        if (productId) qb.andWhere('m.productId = :productId', { productId });
        if (tenantId)  qb.andWhere('m.tenantId = :tenantId', { tenantId });
        if (from)      qb.andWhere('m.createdAt >= :from', { from: from + 'T00:00:00' });
        if (to)        qb.andWhere('m.createdAt <= :to',   { to: to + 'T23:59:59' });
        return qb.getMany();
    }
}
