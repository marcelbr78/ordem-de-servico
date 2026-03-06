import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiagnosticPattern } from './entities/diagnostic-pattern.entity';
import { SmartDiagnosticsService } from './smart-diagnostics.service';
import { SmartDiagnosticsController } from './smart-diagnostics.controller';
import { SmartDiagnosticsListener } from './smart-diagnostics.listener';
import { OrderService } from '../orders/entities/order-service.entity';

@Module({
    imports: [TypeOrmModule.forFeature([DiagnosticPattern, OrderService])],
    controllers: [SmartDiagnosticsController],
    providers: [SmartDiagnosticsService, SmartDiagnosticsListener],
    exports: [SmartDiagnosticsService]
})
export class SmartDiagnosticsModule { }
