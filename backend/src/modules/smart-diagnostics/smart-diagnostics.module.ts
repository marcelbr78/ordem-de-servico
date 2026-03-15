import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiagnosticPattern } from './entities/diagnostic-pattern.entity';
import { SmartDiagnosticsService } from './smart-diagnostics.service';
import { SmartDiagnosticsController } from './smart-diagnostics.controller';
import { SmartDiagnosticsListener } from './smart-diagnostics.listener';
import { ExternalSearchService } from './external-search.service';
import { OrderService } from '../orders/entities/order-service.entity';
import { OrderEquipment } from '../orders/entities/order-equipment.entity';
import { Client } from '../clients/entities/client.entity';
import { AutocompleteController } from '../orders/autocomplete.controller';

@Module({
    imports: [TypeOrmModule.forFeature([DiagnosticPattern, OrderService, OrderEquipment, Client])],
    controllers: [SmartDiagnosticsController, AutocompleteController],
    providers: [SmartDiagnosticsService, SmartDiagnosticsListener, ExternalSearchService],
    exports: [SmartDiagnosticsService, ExternalSearchService],
})
export class SmartDiagnosticsModule {}
