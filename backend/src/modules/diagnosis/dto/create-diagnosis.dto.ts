import { IsString, IsNotEmpty, IsOptional, IsUUID, IsNumber, Min } from 'class-validator';

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

    @IsNumber({}, { message: 'Valor da mão de obra deve ser um número' })
    @Min(0)
    @IsNotEmpty({ message: 'O valor da mão de obra é obrigatório' })
    laborValue: number;
}
