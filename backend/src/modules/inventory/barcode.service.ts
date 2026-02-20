import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

export interface BarcodeResult {
    barcode: string;
    name: string;
    description?: string;
    brand?: string;
    gtin?: string;
    thumbnail?: string;
    found: boolean;
    source: 'local' | 'cosmos' | 'upcitemdb' | 'none';
}

@Injectable()
export class BarcodeService {
    constructor(
        @InjectRepository(Product)
        private productRepository: Repository<Product>,
    ) { }

    async lookup(barcode: string): Promise<BarcodeResult> {
        // 1. Check Local DB
        const localProduct = await this.productRepository.findOne({ where: { barcode } });
        if (localProduct) {
            return {
                barcode,
                name: localProduct.name,
                description: localProduct.name, // Or add description field
                found: true,
                source: 'local'
            };
        }

        // 2. Check External APIs (Cosmos / UPCItemDB / OpenFoodFacts)
        // Note: Real implementation would need API Keys for reliable services.
        // We will implement a basic lookup using a free public API if available, 
        // or a mock for demonstration if keys are missing.

        return this.lookupExternal(barcode);
    }

    private async lookupExternal(barcode: string): Promise<BarcodeResult> {
        // Try UPCItemDB (Free tier available, no key sometimes required or limited)
        try {
            const response = await axios.get(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`);
            if (response.data.items && response.data.items.length > 0) {
                const item = response.data.items[0];
                return {
                    barcode,
                    name: item.title,
                    description: item.description,
                    brand: item.brand,
                    thumbnail: item.images?.[0],
                    found: true,
                    source: 'upcitemdb'
                };
            }
        } catch (error) {
            console.log('UPCItemDB lookup failed', error.message);
        }

        // Try OpenFoodFacts (Good for food/drinks, free)
        try {
            const response = await axios.get(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
            if (response.data.status === 1) {
                const product = response.data.product;
                return {
                    barcode,
                    name: product.product_name,
                    brand: product.brands,
                    thumbnail: product.image_url,
                    found: true,
                    source: 'cosmos' // Using 'cosmos' as generic external for now
                };
            }
        } catch (error) {
            console.log('OpenFoodFacts lookup failed', error.message);
        }

        return {
            barcode,
            name: '',
            found: false,
            source: 'none'
        };
    }
}
