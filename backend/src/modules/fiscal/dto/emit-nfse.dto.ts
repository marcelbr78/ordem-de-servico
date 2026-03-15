import { IsString, IsNumber, IsOptional, IsIn, IsInt, Min } from 'class-validator';

export class EmitNFSeDto {
    @IsString()
    clienteId: string;

    @IsString()
    servicoId: string;

    @IsNumber()
    @Min(0)
    valor: number;

    @IsString()
    @IsOptional()
    discriminacao?: string;

    /** Ambiente: 1=Produção, 2=Homologação */
    @IsInt()
    @IsIn([1, 2])
    @IsOptional()
    ambiente?: number;

    @IsString()
    @IsOptional()
    orderId?: string;
}
