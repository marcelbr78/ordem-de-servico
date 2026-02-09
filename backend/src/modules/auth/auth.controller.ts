import { Controller, Post, Body, UnauthorizedException, HttpCode, HttpStatus, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { AuditService } from '../audit/audit.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private usersService: UsersService,
        private auditService: AuditService,
    ) { }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto, @Req() req: Request) {
        const ip = req.ip;
        const userAgent = req.headers['user-agent'];

        const user = await this.authService.validateUser(loginDto.email, loginDto.password);
        if (!user) {
            // Log de falha de login (Auditoria ERP)
            await this.auditService.log({
                action: 'LOGIN_FAILURE',
                entity: 'User',
                details: `Tentativa de login falhou para o email: ${loginDto.email}`,
                ip,
                userAgent,
            });
            throw new UnauthorizedException('Credenciais inválidas');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Usuário inativo');
        }

        return this.authService.login(user, ip, userAgent);
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(@Body('refresh_token') refreshToken: string, @Req() req: Request) {
        if (!refreshToken) {
            throw new UnauthorizedException('Token de atualização obrigatório');
        }
        return this.authService.refreshToken(refreshToken, req.ip, req.headers['user-agent']);
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(@Body('userId') userId: string) {
        if (!userId) {
            throw new UnauthorizedException('ID do usuário obrigatório');
        }
        return this.authService.logout(userId);
    }

    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        return this.usersService.create(registerDto);
    }
}
