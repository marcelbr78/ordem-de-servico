import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';

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
    ) { }

    async create(createProductDto: CreateProductDto, tenantId?: string): Promise<Product> {
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

    async findOne(id: string): Promise<Product> {
        const product = await this.productRepository.findOne({ where: { id } });
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

    async update(id: string, updateData: Partial<CreateProductDto>): Promise<Product> {
        const product = await this.productRepository.findOne({ where: { id } });
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
}
