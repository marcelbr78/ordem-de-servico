import { IsString, IsNotEmpty, IsOptional, IsUUID, IsEnum, IsNumber, Min } from 'class-validator';

export class CreateOrderServiceDto {
  @IsUUID('4', { message: 'ID do cliente inválido' })
  @IsNotEmpty({ message: 'O cliente é obrigatório' })
  clientId: string;

  @IsString()
  @IsNotEmpty({ message: 'O equipamento é obrigatório' })
  equipment: string;

  @IsString()
  @IsOptional()
  brandModel?: string;

  @IsString()
  @IsOptional()
  serialNumber?: string;

  @IsString()
  @IsNotEmpty({ message: 'O problema relatado é obrigatório' })
  reportedProblem: string;

  @IsString()
  @IsOptional()
  cosmeticCondition?: string;

  @IsNumber({}, { message: 'Valor estimado deve ser um número' })
  @Min(0)
  @IsOptional()
  estimatedValue?: number;
}
