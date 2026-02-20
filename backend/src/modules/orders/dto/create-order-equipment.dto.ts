import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateOrderEquipmentDto {
    @IsBoolean()
    @IsOptional()
    isMain?: boolean;

    @IsString()
    @IsNotEmpty({ message: 'Tipo do equipamento é obrigatório' })
    type: string;

    @IsString()
    @IsNotEmpty({ message: 'Marca é obrigatória' })
    brand: string;

    @IsString()
    @IsNotEmpty({ message: 'Modelo é obrigatório' })
    model: string;

    @IsString()
    @IsOptional()
    serialNumber?: string;

    @IsString()
    @IsNotEmpty({ message: 'Defeito relatado é obrigatório' })
    reportedDefect: string;

    @IsString()
    @IsOptional()
    accessories?: string;

    @IsString()
    @IsOptional()
    condition?: string;
}
