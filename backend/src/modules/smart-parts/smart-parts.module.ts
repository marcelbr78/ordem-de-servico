import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SmartPartsService } from './smart-parts.service';
import { SmartPartsController } from './smart-parts.controller';
import { OrderService } from '../orders/entities/order-service.entity';
import { Quote } from '../smartparts/entities/quote.entity';

@Module({
    imports: [TypeOrmModule.forFeature([OrderService, Quote])],
    controllers: [SmartPartsController],
    providers: [SmartPartsService],
    exports: [SmartPartsService]
})
export class SmartPartsSuggestionModule { }
