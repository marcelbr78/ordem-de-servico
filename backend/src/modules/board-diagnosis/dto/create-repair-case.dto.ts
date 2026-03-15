import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateRepairCaseDto {
    @IsString()
    @IsNotEmpty()
    board_id: string;

    @IsString()
    @IsOptional()
    symptom_category_id?: string;

    @IsString()
    @IsOptional()
    symptom?: string;

    @IsOptional()
    measurements_summary?: any;

    @IsString()
    @IsOptional()
    circuit_id?: string;

    @IsString()
    @IsOptional()
    defective_component?: string;

    @IsString()
    @IsOptional()
    repair_action?: string;

    @IsOptional()
    success?: boolean;
}
