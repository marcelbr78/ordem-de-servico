import { IsString, IsNotEmpty, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { OSStatus } from '../entities/order-service.entity';

export class ChangeStatusDto {
    @IsEnum(OSStatus, { message: 'Status inválido' })
    status: OSStatus;

    @IsString()
    @IsNotEmpty({ message: 'Comentário é obrigatório para mudança de status' })
    comments: string;

    @IsString()
    @IsOptional()
    paymentMethod?: string;

    @IsUUID()
    @IsOptional()
    bankAccountId?: string;

    @IsOptional()
    paymentDate?: string;
}
