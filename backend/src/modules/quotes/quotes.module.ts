import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuoteDocument } from './entities/quote-document.entity';
import { QuotesService } from './quotes.service';
import { QuotesController } from './quotes.controller';
import { QuotePdfService } from './pdf/quote-pdf.service';
import { OrderService } from '../orders/entities/order-service.entity';
import { SettingsModule } from '../settings/settings.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([QuoteDocument, OrderService]),
        SettingsModule,
    ],
    controllers: [QuotesController],
    providers: [QuotesService, QuotePdfService],
    exports: [QuotesService],
})
export class QuotesModule {}
