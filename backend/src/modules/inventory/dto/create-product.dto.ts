import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsEnum } from 'class-validator';

export class CreateProductDto {
    @IsString()
    @IsNotEmpty({ message: 'O nome do produto é obrigatório' })
    name: string;

    @IsString()
    @IsEnum(['product', 'service'], { message: 'Tipo inválido' })
    @IsOptional()
    type?: 'product' | 'service';

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    sku?: string;

    @IsString()
    @IsOptional()
    barcode?: string;

    @IsString()
    @IsOptional()
    brand?: string;

    @IsString()
    @IsOptional()
    category?: string;

    @IsString()
    @IsOptional()
    unit?: string;

    @IsString()
    @IsOptional()
    ncm?: string;

    @IsString()
    @IsOptional()
    cfop?: string;

    @IsString()
    @IsOptional()
    origin?: string;

    @IsString()
    @IsOptional()
    supplierId?: string;

    @IsNumber({}, { message: 'A quantidade deve ser um número' })
    @Min(0)
    @IsOptional()
    quantity?: number;

    @IsNumber({}, { message: 'A quantidade mínima deve ser um número' })
    @Min(0)
    @IsOptional()
    minQuantity?: number;

    @IsNumber({}, { message: 'O preço de custo deve ser um número' })
    @Min(0)
    @IsOptional()
    priceCost?: number;

    @IsNumber({}, { message: 'O preço de venda deve ser um número' })
    @Min(0)
    @IsOptional()
    priceSell?: number;
}
