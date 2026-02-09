import { IsEnum, IsNumber, IsNotEmpty, IsString, IsOptional, IsUUID, Min } from 'class-validator';
import { TransactionType } from '../entities/transaction.entity';

export class CreateTransactionDto {
    @IsEnum(TransactionType)
    @IsNotEmpty()
    type: TransactionType;

    @IsNumber()
    @Min(0.01)
    @IsNotEmpty()
    amount: number;

    @IsString()
    @IsNotEmpty()
    paymentMethod: string;

    @IsString()
    @IsNotEmpty()
    category: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsUUID()
    @IsOptional()
    orderId?: string;
}
