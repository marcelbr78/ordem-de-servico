import { Controller, Post, Body, Param, Put, Get, UseGuards } from '@nestjs/common';
import { DiagnosisService } from './diagnosis.service';
import { CreateDiagnosisDto } from './dto/create-diagnosis.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('diagnosis')
@UseGuards(JwtAuthGuard)
export class DiagnosisController {
    constructor(private readonly diagnosisService: DiagnosisService) { }

    @Post()
    create(@Body() createDto: CreateDiagnosisDto) {
        return this.diagnosisService.create(createDto);
    }

    @Get('order/:orderId')
    findByOrder(@Param('orderId') orderId: string) {
        return this.diagnosisService.findByOrder(orderId);
    }

    @Put('approve/:orderId')
    approve(@Param('orderId') orderId: string) {
        return this.diagnosisService.approve(orderId);
    }

    @Put('reject/:orderId')
    reject(@Param('orderId') orderId: string) {
        return this.diagnosisService.reject(orderId);
    }
}
