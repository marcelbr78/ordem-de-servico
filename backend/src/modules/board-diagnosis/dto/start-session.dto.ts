import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class StartSessionDto {
    @IsString()
    @IsNotEmpty()
    board_id: string;

    @IsString()
    @IsNotEmpty()
    symptom_category_id: string;

    @IsOptional()
    @IsString()
    symptom_description?: string;

    @IsOptional()
    @IsNumber()
    charger_current?: number;

    @IsOptional()
    @IsNumber()
    bench_current?: number;

    @IsOptional()
    @IsNumber()
    power_button_current?: number;
}
