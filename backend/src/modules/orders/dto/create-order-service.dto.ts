import { IsString, IsNotEmpty, IsOptional, IsUUID, IsEnum, IsNumber, Min, ValidateNested, ArrayMinSize, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderEquipmentDto } from './create-order-equipment.dto';
import { OSPriority } from '../entities/order-service.entity';

export class CreateOrderServiceDto {
  @IsUUID('4', { message: 'ID do cliente inválido' })
  @IsNotEmpty({ message: 'O cliente é obrigatório' })
  clientId: string;

  @IsUUID('4', { message: 'ID do técnico inválido' })
  @IsNotEmpty({ message: 'O técnico responsável é obrigatório' })
  technicianId: string;

  @IsEnum(OSPriority)
  @IsOptional()
  priority?: OSPriority;

  @IsArray()
  @ArrayMinSize(1, { message: 'Pelo menos 1 equipamento é obrigatório' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderEquipmentDto)
  equipments: CreateOrderEquipmentDto[];

  @IsNumber({}, { message: 'Valor estimado deve ser um número' })
  @Min(0)
  @IsOptional()
  estimatedValue?: number;

  @IsString()
  @IsOptional()
  @IsString()
  @IsOptional()
  initialObservations?: string; // Observações gerais iniciais da OS se necessário

  @IsString()
  @IsOptional()
  reportedDefect?: string;

  @IsString()
  @IsOptional()
  diagnosis?: string;
}
