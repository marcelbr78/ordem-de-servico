import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { OSStatus } from '../entities/order-service.entity';

export class ChangeStatusDto {
    @IsEnum(OSStatus, { message: 'Status inválido' })
    status: OSStatus;

    @IsString()
    @IsNotEmpty({ message: 'Comentário é obrigatório para mudança de status' })
    comments: string;
}
