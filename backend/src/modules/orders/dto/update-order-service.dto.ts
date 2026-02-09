import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderServiceDto } from './create-order-service.dto';
import { IsEnum, IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { OSStatus } from '../entities/order-service.entity';

export class UpdateOrderServiceDto extends PartialType(CreateOrderServiceDto) {
    @IsEnum(OSStatus)
    @IsOptional()
    status?: OSStatus;

    @IsString()
    @IsOptional()
    diagnosis?: string;

    @IsString()
    @IsOptional()
    solution?: string;

    @IsNumber()
    @Min(0)
    @IsOptional()
    paidValue?: number;

    @IsString()
    @IsOptional()
    technicianId?: string;
}
