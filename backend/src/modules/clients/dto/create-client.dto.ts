import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsEmail,
    IsEnum,
    IsArray,
    ValidateNested,
    ValidateIf,
    Matches,
    ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ClientType } from '../entities/client.entity';
import { IsValidCpfCnpj } from '../validators/cpf-cnpj.validator';
import { CreateContactDto } from './create-contact.dto';

export class CreateClientDto {
    @IsEnum(ClientType, { message: 'Tipo deve ser PF ou PJ' })
    @IsNotEmpty({ message: 'Tipo é obrigatório' })
    tipo: ClientType;

    @IsString()
    @IsNotEmpty({ message: 'Nome é obrigatório' })
    nome: string;

    @ValidateIf((o) => o.tipo === 'PJ')
    @IsString()
    @IsOptional()
    nomeFantasia?: string;

    @IsString()
    @IsNotEmpty({ message: 'CPF/CNPJ é obrigatório' })
    @Matches(/^\d{11}$|^\d{14}$|^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, {
        message: 'CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos',
    })
    @IsValidCpfCnpj({ message: 'CPF/CNPJ inválido (dígito verificador incorreto)' })
    cpfCnpj: string;

    @IsEmail({}, { message: 'E-mail inválido' })
    @IsOptional()
    email?: string;

    // ─── Contatos inline (pelo menos 1 obrigatório) ──

    @IsArray()
    @ArrayMinSize(1, { message: 'Pelo menos 1 contato é obrigatório' })
    @ValidateNested({ each: true })
    @Type(() => CreateContactDto)
    contatos: CreateContactDto[];

    // ─── Endereço Estruturado ────────────────────────

    @IsString()
    @IsOptional()
    @Matches(/^\d{8}$/, { message: 'CEP deve conter 8 dígitos' })
    cep?: string;

    @IsString()
    @IsOptional()
    rua?: string;

    @IsString()
    @IsOptional()
    numero?: string;

    @IsString()
    @IsOptional()
    complemento?: string;

    @IsString()
    @IsOptional()
    bairro?: string;

    @IsString()
    @IsOptional()
    cidade?: string;

    @IsString()
    @IsOptional()
    @Matches(/^[A-Z]{2}$/, { message: 'Estado deve ser a sigla com 2 letras (ex: SP)' })
    estado?: string;

    // ─── Observações ────────────────────────────────

    @IsString()
    @IsOptional()
    observacoes?: string;
}
