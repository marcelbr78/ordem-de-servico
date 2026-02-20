import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { Product } from './entities/product.entity';
import { StockBalance } from './entities/stock-balance.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { StockService } from './stock.service';

import { HttpModule } from '@nestjs/axios';
import { BarcodeService } from './barcode.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Product, StockBalance, StockMovement]),
        HttpModule
    ],
    controllers: [InventoryController],
    providers: [InventoryService, StockService, BarcodeService],
    exports: [InventoryService, StockService]
})
export class InventoryModule { }
