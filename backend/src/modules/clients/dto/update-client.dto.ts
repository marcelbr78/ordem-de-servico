import { IsString, IsOptional, IsEmail, Matches } from 'class-validator';

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

    // CPF/CNPJ e tipo NÃO podem ser alterados via update
}
