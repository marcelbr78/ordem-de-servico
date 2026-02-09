import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
    @IsNotEmpty({ message: 'O e-mail ou usuário é obrigatório' })
    email: string;

    @IsNotEmpty({ message: 'A senha é obrigatória' })
    @MinLength(8, { message: 'A senha deve ter pelo menos 8 caracteres' })
    password: string;
}
