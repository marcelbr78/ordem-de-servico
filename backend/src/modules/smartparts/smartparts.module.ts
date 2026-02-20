import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import { Supplier } from './entities/supplier.entity';
import { Quote } from './entities/quote.entity';
import { QuoteResponse } from './entities/quote-response.entity';

import { SuppliersService } from './suppliers.service';
import { SmartPartsService } from './smartparts.service';

import { SuppliersController } from './suppliers.controller';
import { SmartPartsController } from './smartparts.controller';

import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Supplier, Quote, QuoteResponse]),
        WhatsappModule,
        InventoryModule,
        ScheduleModule.forRoot(),
    ],
    controllers: [SuppliersController, SmartPartsController],
    providers: [SuppliersService, SmartPartsService],
    exports: [SmartPartsService],
})
export class SmartPartsModule { }
