import { Type } from 'class-transformer';
import {
    IsString, IsNumber, IsOptional, IsArray, ValidateNested,
    IsIn, IsEmail, Min, IsInt,
} from 'class-validator';

export class ItemNFeDto {
    @IsString()
    produtoId: string;

    @IsNumber()
    @Min(0.001)
    quantidade: number;

    @IsNumber()
    @Min(0)
    valorUnitario: number;

    @IsString()
    @IsOptional()
    desconto?: number;
}

export class EmitNFeDto {
    @IsString()
    clienteId: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ItemNFeDto)
    itens: ItemNFeDto[];

    /** Ambiente: 1=Produção, 2=Homologação */
    @IsInt()
    @IsIn([1, 2])
    @IsOptional()
    ambiente?: number;

    @IsString()
    @IsOptional()
    orderId?: string;

    @IsString()
    @IsOptional()
    informacoesAdicionais?: string;

    /** Finalidade: 1=Normal, 2=Complementar, 3=Ajuste, 4=Devolução */
    @IsInt()
    @IsOptional()
    finalidade?: number;
}
