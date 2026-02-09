import { Controller, Get, Post, Body, Param, Put, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateProductDto } from './dto/create-product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
    constructor(private readonly inventoryService: InventoryService) { }

    @Post()
    create(@Body() createProductDto: CreateProductDto) {
        return this.inventoryService.create(createProductDto);
    }

    @Get()
    findAll() {
        return this.inventoryService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.inventoryService.findOne(id);
    }

    @Put(':id/:type/:quantity')
    updateQuantity(
        @Param('id') id: string,
        @Param('type') type: 'IN' | 'OUT',
        @Param('quantity') quantity: string,
    ) {
        return this.inventoryService.updateQuantity(id, parseInt(quantity), type);
    }
}
