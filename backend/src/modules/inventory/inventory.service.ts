import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class InventoryService {
    constructor(
        @InjectRepository(Product)
        private productRepository: Repository<Product>,
    ) { }

    async create(createProductDto: CreateProductDto): Promise<Product> {
        if (createProductDto.sku) {
            const existing = await this.productRepository.findOne({ where: { sku: createProductDto.sku } });
            if (existing) {
                throw new ConflictException('Já existe um produto com este SKU');
            }
        }

        const product = this.productRepository.create(createProductDto);
        return this.productRepository.save(product);
    }

    async findAll(): Promise<Product[]> {
        return this.productRepository.find({
            relations: ['balance'],
            order: { name: 'ASC' }
        });
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
            product = this.productRepository.create({
                name: name.trim(),
                priceCost: cost,
                priceSell: cost * 1.5, // Default 50% margin
                minQuantity: 1,
                sku: tempSku,
            });
            product = await this.productRepository.save(product);
        }
        return product;
    }

    async update(id: string, updateData: Partial<CreateProductDto>): Promise<Product> {
        const product = await this.productRepository.findOne({ where: { id } });
        if (!product) {
            throw new NotFoundException('Produto não encontrado');
        }
        Object.assign(product, updateData);
        return this.productRepository.save(product);
    }

    async updateQuantity(id: string, quantity: number, type: 'IN' | 'OUT'): Promise<Product> {
        // Deprecated: Logic moved to StockService
        // Just return the product for now or throw error if called
        return this.findOne(id);
    }
}
