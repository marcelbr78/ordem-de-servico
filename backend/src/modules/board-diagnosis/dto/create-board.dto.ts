import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateBoardDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    model: string;

    @IsString()
    @IsNotEmpty()
    manufacturer: string;

    @IsOptional()
    @IsString()
    schematic_file?: string;

    @IsOptional()
    @IsString()
    boardview_file?: string;
}
