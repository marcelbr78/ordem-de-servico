import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiagnosisService } from './diagnosis.service';
import { DiagnosisController } from './diagnosis.controller';
import { Diagnosis } from './entities/diagnosis.entity';
import { OrderService } from '../orders/entities/order-service.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Diagnosis, OrderService])],
    controllers: [DiagnosisController],
    providers: [DiagnosisService],
    exports: [DiagnosisService],
})
export class DiagnosisModule { }
