import { IsString, IsNotEmpty, IsOptional, IsUUID, IsNumber, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateDiagnosisDto {
    @IsUUID('4', { message: 'ID da Ordem de Serviço inválido' })
    @IsNotEmpty({ message: 'A Ordem de Serviço é obrigatória' })
    orderId: string;

    @IsOptional()
    checklistEntry?: any;

    @IsString()
    @IsNotEmpty({ message: 'O laudo técnico é obrigatório' })
    technicalReport: string;

    @IsOptional()
    partsNeeded?: any;

    @Transform(({ value }) => {
        if (value === undefined || value === null || value === '') return 0;
        const n = parseFloat(String(value));
        return isNaN(n) ? 0 : n;
    })
    @IsNumber({}, { message: 'Valor da mão de obra deve ser um número' })
    @Min(0)
    @IsOptional()
    laborValue?: number;
}
