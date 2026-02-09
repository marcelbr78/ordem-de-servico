import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateProductDto {
    @IsString()
    @IsNotEmpty({ message: 'O nome do produto é obrigatório' })
    name: string;

    @IsString()
    @IsOptional()
    sku?: string;

    @IsNumber({}, { message: 'A quantidade deve ser um número' })
    @Min(0)
    quantity: number;

    @IsNumber({}, { message: 'A quantidade mínima deve ser um número' })
    @Min(0)
    minQuantity: number;

    @IsNumber({}, { message: 'O preço de custo deve ser um número' })
    @Min(0)
    priceCost: number;

    @IsNumber({}, { message: 'O preço de venda deve ser um número' })
    @Min(0)
    priceSell: number;
}
