import { Controller, Get, Post, Body, Param, Put, UseGuards, Query } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateProductDto } from './dto/create-product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StockService } from './stock.service';
import { BarcodeService } from './barcode.service';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
    constructor(
        private readonly inventoryService: InventoryService,
        private readonly stockService: StockService,
        private readonly barcodeService: BarcodeService
    ) { }

    @Post()
    create(@Body() createProductDto: CreateProductDto) {
        return this.inventoryService.create(createProductDto);
    }

    @Get()
    findAll(@Query('search') search?: string) {
        return this.inventoryService.findAll(search);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.inventoryService.findOne(id);
    }

    @Get('barcode/:code')
    async findByBarcode(@Param('code') code: string) {
        return this.barcodeService.lookup(code);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() updateData: CreateProductDto) {
        return this.inventoryService.update(id, updateData);
    }


    @Put(':id/:type/:quantity')
    async updateQuantity(
        @Param('id') id: string,
        @Param('type') type: 'IN' | 'OUT',
        @Param('quantity') quantity: string,
    ) {
        const qty = parseInt(quantity);

        if (type === 'IN') {
            // For manual entry, we use current product cost or 0
            const product = await this.inventoryService.findOne(id);
            await this.stockService.addStock(null, [{ productId: id, quantity: qty, cost: product.priceCost || 0 }]);
        } else {
            await this.stockService.consumeStock(null, [{ productId: id, quantity: qty }]);
        }

        return this.inventoryService.findOne(id);
    }
}
