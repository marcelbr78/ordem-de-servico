import { IsEmail, IsNotEmpty, MinLength, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export class RegisterDto {
    @IsNotEmpty({ message: 'O e-mail ou usuário é obrigatório' })
    email: string;

    @IsNotEmpty({ message: 'O nome é obrigatório' })
    name: string;

    @IsNotEmpty({ message: 'A senha é obrigatória' })
    @MinLength(8, { message: 'A senha deve ter pelo menos 8 caracteres' })
    password: string;

    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;
}
