import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class AddPartDto {
    @IsString()
    productId: string;

    @IsNumber()
    @Min(1)
    quantity: number;

    @IsNumber()
    @Min(0)
    unitPrice: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    unitCost?: number;
}
