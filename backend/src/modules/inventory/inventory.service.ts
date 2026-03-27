import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { PlansService } from '../tenants/plans.service';
import { SubscriptionStatus } from '../tenants/entities/subscription.entity';

// Helper to clean incoming data (Vite might send empty strings for optional fields)
function sanitise<T>(data: T): T {
    const result = { ...data } as any;
    Object.keys(result).forEach(key => {
        if (result[key] === '') {
            result[key] = null;
        }
    });
    return result;
}

@Injectable()
export class InventoryService {
    constructor(
        @InjectRepository(Product)
        private productRepository: Repository<Product>,
        private plansService: PlansService,
    ) { }

    async create(createProductDto: CreateProductDto, tenantId?: string): Promise<Product> {
        // Check plan inventory limit (graceful — não quebra se plansService não tiver findSubscription)
        if (tenantId) {
            try {
                const sub = await (this.plansService as any).findSubscription?.(tenantId);
                if (sub) {
                    if (sub.status === 'CANCELLED' || sub.status === 'SUSPENDED') {
                        throw new ForbiddenException('Sua assinatura está cancelada ou suspensa.');
                    }
                    const storageLimit = sub.plan?.storageLimit || 0;
                    if (storageLimit > 0) {
                        const currentCount = await this.productRepository.count({ where: { tenantId } });
                        if (currentCount >= storageLimit) {
                            throw new ForbiddenException(
                                `Limite de ${storageLimit} itens atingido. Faça upgrade do plano.`
                            );
                        }
                    }
                }
            } catch (e: any) {
                if (e instanceof ForbiddenException) throw e;
                // ignora erros de verificação de plano
            }
        }
        const data = sanitise(createProductDto);

        if (data.sku) {
            const existing = await this.productRepository.findOne({ where: tenantId ? { sku: data.sku, tenantId } : { sku: data.sku } });
            if (existing) {
                throw new ConflictException('Já existe um produto com este SKU');
            }
        }

        if (data.barcode) {
            const existing = await this.productRepository.findOne({ where: tenantId ? { barcode: data.barcode, tenantId } : { barcode: data.barcode } });
            if (existing) {
                throw new ConflictException('Já existe um produto com este Código de Barras');
            }
        }

        const product = Object.assign(new Product(), { ...data, tenantId });
        return this.productRepository.save(product);
    }

    async findAll(search?: string, tenantId?: string): Promise<Product[]> {
        const query = this.productRepository.createQueryBuilder('product')
            .leftJoinAndSelect('product.balance', 'balance');

        if (tenantId) {
            query.where('product.tenantId = :tenantId', { tenantId });
        }

        if (search) {
            const condition = 'product.name LIKE :search OR product.sku LIKE :search';
            if (tenantId) {
                query.andWhere(condition, { search: `%${search}%` });
            } else {
                query.where(condition, { search: `%${search}%` });
            }
        }

        return query.orderBy('product.name', 'ASC').getMany();
    }

    async findOne(id: string, tenantId?: string): Promise<Product> {
        const where = tenantId ? { id, tenantId } : { id };
        const product = await this.productRepository.findOne({ where });
        if (!product) {
            throw new NotFoundException('Produto não encontrado');
        }
        return product;
    }

    async findOrCreateProduct(name: string, cost: number): Promise<Product> {
        let product = await this.productRepository.findOne({ where: { name: name.trim() } });
        if (!product) {
            const tempSku = `SP-${Date.now().toString().slice(-6)}`;
            const newProduct = Object.assign(new Product(), {
                name: name.trim(),
                priceCost: cost,
                priceSell: cost * 1.5, // Default 50% margin
                minQuantity: 1,
                sku: tempSku,
            });
            product = await this.productRepository.save(newProduct);
        }
        return product;
    }

    async update(id: string, updateData: Partial<CreateProductDto>, tenantId?: string): Promise<Product> {
        const where = tenantId ? { id, tenantId } : { id };
        const product = await this.productRepository.findOne({ where });
        if (!product) {
            throw new NotFoundException('Produto não encontrado');
        }
        const data = sanitise(updateData);
        Object.assign(product, data);
        return this.productRepository.save(product);
    }

    async updateQuantity(id: string, quantity: number, type: 'IN' | 'OUT'): Promise<Product> {
        // Deprecated: Logic moved to StockService
        return this.findOne(id);
    }

    async remove(id: string, tenantId?: string): Promise<void> {
        await this.productRepository.delete(tenantId ? { id, tenantId } : id);
    }

    async getSummary(tenantId?: string) {
        const where = tenantId ? { tenantId } : {};
        const products = await this.productRepository.find({ where, relations: ['balance'] });
        const items = products.filter(p => p.type === 'product');
        const totalItems = items.length;
        const totalValue = items.reduce((s, p) => s + (Number(p.priceCost) * (p.balance?.quantity || 0)), 0);
        const totalSellValue = items.reduce((s, p) => s + (Number(p.priceSell) * (p.balance?.quantity || 0)), 0);
        const lowStock = items.filter(p => p.minQuantity > 0 && (p.balance?.quantity || 0) <= p.minQuantity).length;
        const zeroStock = items.filter(p => (p.balance?.quantity || 0) === 0).length;
        return { totalItems, totalValue, totalSellValue, lowStock, zeroStock };
    }

    async getLowStock(tenantId?: string) {
        const where = tenantId ? { tenantId } : {};
        const products = await this.productRepository.find({ where, relations: ['balance'] });
        return products.filter(p => p.type === 'product' && p.minQuantity > 0 && (p.balance?.quantity || 0) <= p.minQuantity)
            .sort((a, b) => (a.balance?.quantity || 0) - (b.balance?.quantity || 0));
    }

    async getAbcCurve(tenantId?: string) {
        const where = tenantId ? { tenantId } : {};
        const products = await this.productRepository.find({ where, relations: ['balance'] });
        const items = products.filter(p => p.type === 'product').map(p => ({
            id: p.id, name: p.name, sku: p.sku, quantity: p.balance?.quantity || 0,
            cost: Number(p.priceCost), value: Number(p.priceCost) * (p.balance?.quantity || 0),
        })).sort((a, b) => b.value - a.value);
        const totalValue = items.reduce((s, i) => s + i.value, 0);
        let cumulative = 0;
        return items.map(item => {
            cumulative += item.value;
            const pct = totalValue > 0 ? (cumulative / totalValue) * 100 : 0;
            return { ...item, cumulative, cumulativePct: pct, abc: pct <= 80 ? 'A' : pct <= 95 ? 'B' : 'C' };
        });
    }
}
