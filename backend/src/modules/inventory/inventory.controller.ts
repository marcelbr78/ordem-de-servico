import { Controller, Get, Post, Body, Param, Put, Patch, Delete, UseGuards, Query, Req, Res } from '@nestjs/common';
import { Response } from 'express';
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
    ) {}

    @Post()
    create(@Body() dto: CreateProductDto, @Req() req: any) {
        return this.inventoryService.create(dto, req.user?.tenantId);
    }

    @Get()
    findAll(@Query() q: any, @Req() req: any) {
        return this.inventoryService.findAll(q.search, req?.user?.tenantId);
    }

    @Get('summary')
    getSummary(@Req() req: any) {
        return this.inventoryService.getSummary(req?.user?.tenantId);
    }

    @Get('low-stock')
    getLowStock(@Req() req: any) {
        return this.inventoryService.getLowStock(req?.user?.tenantId);
    }

    @Get('movements')
    getMovements(@Query() q: any, @Req() req: any) {
        return this.stockService.getMovements(q.productId, q.from, q.to, req?.user?.tenantId);
    }

    @Get('abc')
    getAbcCurve(@Req() req: any) {
        return this.inventoryService.getAbcCurve(req?.user?.tenantId);
    }

    @Get('barcode/:code')
    findByBarcode(@Param('code') code: string) {
        return this.barcodeService.lookup(code);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.inventoryService.findOne(id);
    }

    @Get(':id/movements')
    getProductMovements(@Param('id') id: string) {
        return this.stockService.getMovements(id);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() dto: CreateProductDto) {
        return this.inventoryService.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.inventoryService.remove(id);
    }

    // Entrada manual de estoque
    @Post(':id/entry')
    entry(
        @Param('id') id: string,
        @Body() body: { quantity: number; cost?: number; reason?: string; supplierId?: string; invoiceNumber?: string },
        @Req() req: any,
    ) {
        return this.stockService.manualEntry(id, body.quantity, body.cost, body.reason, body.supplierId, body.invoiceNumber, req.user?.tenantId);
    }

    // Saída manual de estoque
    @Post(':id/exit')
    exit(
        @Param('id') id: string,
        @Body() body: { quantity: number; reason?: string },
        @Req() req: any,
    ) {
        return this.stockService.manualExit(id, body.quantity, body.reason, req.user?.tenantId);
    }

    // Ajuste de inventário (sobrescreve o saldo)
    @Post(':id/adjust')
    adjust(
        @Param('id') id: string,
        @Body() body: { quantity: number; reason?: string },
        @Req() req: any,
    ) {
        return this.stockService.adjust(id, body.quantity, body.reason, req.user?.tenantId);
    }

    // Entrada em lote (por nota de compra)
    @Post('purchase')
    purchase(
        @Body() body: { items: Array<{ productId: string; quantity: number; cost: number }>; invoiceNumber?: string; supplierId?: string; notes?: string },
        @Req() req: any,
    ) {
        return this.stockService.purchaseEntry(body.items, body.invoiceNumber, body.supplierId, req.user?.tenantId);
    }

    // Legado
    @Put(':id/:type/:quantity')
    updateQuantity(@Param('id') id: string, @Param('type') type: 'IN' | 'OUT', @Param('quantity') quantity: string) {
        const qty = parseInt(quantity);
        if (type === 'IN') return this.stockService.manualEntry(id, qty);
        return this.stockService.manualExit(id, qty);
    }
}
