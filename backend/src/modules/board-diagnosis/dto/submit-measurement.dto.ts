import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SubmitMeasurementDto {
    @IsString()
    @IsNotEmpty()
    step_id: string;

    @IsString()
    @IsNotEmpty()
    measurement: string;

    @IsOptional()
    @IsString()
    result?: string; // e.g. 'pass', 'fail'
}
