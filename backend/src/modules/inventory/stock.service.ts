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
                const balance = await this.getBalance(em, item.productId);
                if (balance.quantity < item.quantity) {
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

    async reverseMovement(orderId: string) {
        await this.dataSource.transaction(async (em) => {
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
        });
    }
}
