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
        return this.productRepository.find();
    }

    async findOne(id: string): Promise<Product> {
        const product = await this.productRepository.findOne({ where: { id } });
        if (!product) {
            throw new NotFoundException('Produto não encontrado');
        }
        return product;
    }

    async updateQuantity(id: string, quantity: number, type: 'IN' | 'OUT'): Promise<Product> {
        const product = await this.findOne(id);
        if (type === 'OUT' && product.quantity < quantity) {
            throw new ConflictException('Estoque insuficiente');
        }

        product.quantity = type === 'IN' ? product.quantity + quantity : product.quantity - quantity;
        return this.productRepository.save(product);
    }
}
