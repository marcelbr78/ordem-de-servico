import { IsString, IsNotEmpty, IsOptional, IsEmail, Matches } from 'class-validator';

export class CreateClientDto {
    @IsString()
    @IsNotEmpty({ message: 'O nome do cliente é obrigatório' })
    name: string;

    @IsString()
    @IsNotEmpty({ message: 'O WhatsApp é obrigatório' })
    @Matches(/^\d{10,15}$/, { message: 'WhatsApp deve conter apenas números e entre 10 a 15 dígitos' })
    whatsapp: string;

    @IsEmail({}, { message: 'E-mail inválido' })
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    document?: string;

    @IsString()
    @IsOptional()
    address?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}
