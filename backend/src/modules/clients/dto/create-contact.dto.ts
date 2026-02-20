import { IsString, IsNotEmpty, IsEnum, IsBoolean, IsOptional, Matches } from 'class-validator';
import { ContactType } from '../entities/client-contact.entity';

export class CreateContactDto {
    @IsEnum(ContactType, { message: 'Tipo de contato deve ser telefone ou whatsapp' })
    @IsNotEmpty()
    tipo: ContactType;

    @IsString()
    @IsNotEmpty({ message: 'Número é obrigatório' })
    @Matches(/^(\+)?\d{7,20}$/, {
        message: 'Número deve conter apenas dígitos (mínimo 7). Use código do país se necessário (ex: +351...)',
    })
    numero: string;

    @IsBoolean()
    @IsOptional()
    principal?: boolean;
}
