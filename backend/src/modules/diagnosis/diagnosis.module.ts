import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiagnosisService } from './diagnosis.service';
import { DiagnosisController } from './diagnosis.controller';
import { Diagnosis } from './entities/diagnosis.entity';
import { OrdersModule } from '../orders/orders.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Diagnosis]),
        OrdersModule
    ],
    controllers: [DiagnosisController],
    providers: [DiagnosisService],
    exports: [DiagnosisService],
})
export class DiagnosisModule { }
