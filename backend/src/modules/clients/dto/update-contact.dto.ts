import { IsString, IsEnum, IsBoolean, IsOptional, Matches } from 'class-validator';
import { ContactType } from '../entities/client-contact.entity';

export class UpdateContactDto {
    @IsEnum(ContactType, { message: 'Tipo de contato deve ser telefone ou whatsapp' })
    @IsOptional()
    tipo?: ContactType;

    @IsString()
    @IsOptional()
    @Matches(/^(\+)?\d{7,20}$/, {
        message: 'Número deve conter apenas dígitos (mínimo 7). Use código do país se necessário (ex: +351...)',
    })
    numero?: string;

    @IsBoolean()
    @IsOptional()
    principal?: boolean;
}
