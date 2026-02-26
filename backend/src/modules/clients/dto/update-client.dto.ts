import { IsString, IsOptional, IsEmail, Matches, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateContactDto } from './create-contact.dto';

export class SyncContactDto extends CreateContactDto {
    @IsString()
    @IsOptional()
    id?: string;
}

export class UpdateClientDto {
    @IsString()
    @IsOptional()
    nome?: string;

    @IsString()
    @IsOptional()
    nomeFantasia?: string;

    @IsEmail({}, { message: 'E-mail inválido' })
    @IsOptional()
    email?: string;

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

    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => SyncContactDto)
    contatos?: SyncContactDto[];

    // CPF/CNPJ e tipo NÃO podem ser alterados via update
}
