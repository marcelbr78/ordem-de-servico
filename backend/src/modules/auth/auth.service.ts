import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private auditService: AuditService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        console.log(`[AUTH DEBUG] Tentativa de login para: ${email}`);
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            console.log('[AUTH DEBUG] Usuário não encontrado no banco de dados.');
            return null;
        }

        console.log('[AUTH DEBUG] Usuário encontrado. Verificando senha...');
        const isMatch = await bcrypt.compare(pass, user.password);
        console.log(`[AUTH DEBUG] Senha confere? ${isMatch}`);

        if (user && isMatch) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any, ip?: string, userAgent?: string) {
        const payload = { email: user.email, sub: user.id, role: user.role };
        const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
        const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

        // Salvar hash do refresh token no banco
        const salt = await bcrypt.genSalt();
        const refreshTokenHash = await bcrypt.hash(refreshToken, salt);
        await this.usersService.updateRefreshToken(user.id, refreshTokenHash);

        // Registrar login com sucesso
        await this.auditService.log({
            userId: user.id,
            action: 'LOGIN_SUCCESS',
            entity: 'User',
            entityId: user.id,
            ip,
            userAgent,
        });

        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                mustChangePassword: user.mustChangePassword,
            }
        };
    }

    async refreshToken(oldRefreshToken: string, ip?: string, userAgent?: string) {
        try {
            const payload = this.jwtService.verify(oldRefreshToken);
            const user = await this.usersService.findById(payload.sub);

            if (!user || !user.isActive || !user.refreshTokenHash) {
                throw new UnauthorizedException('Sessão inválida');
            }

            // Validar hash do token
            const isTokenMatch = await bcrypt.compare(oldRefreshToken, user.refreshTokenHash);
            if (!isTokenMatch) {
                // Possível tentativa de reuso de token (ataque de sequestro)
                // Invalida todos os tokens do usuário por segurança
                await this.usersService.updateRefreshToken(user.id, null);
                await this.auditService.log({
                    userId: user.id,
                    action: 'REFRESH_TOKEN_REUSE_ATTEMPT',
                    entity: 'User',
                    entityId: user.id,
                    details: 'Detecção de tentativa de reuso de Refresh Token - Invalidação total',
                    ip,
                    userAgent,
                });
                throw new UnauthorizedException('Tentativa de reuso de token detectada');
            }

            // Rotação de Refresh Token
            const newPayload = { email: user.email, sub: user.id, role: user.role };
            const accessToken = this.jwtService.sign(newPayload, { expiresIn: '15m' });
            const newRefreshToken = this.jwtService.sign(newPayload, { expiresIn: '7d' });

            const salt = await bcrypt.genSalt();
            const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, salt);
            await this.usersService.updateRefreshToken(user.id, newRefreshTokenHash);

            return {
                access_token: accessToken,
                refresh_token: newRefreshToken,
            };
        } catch (e) {
            throw new UnauthorizedException('Token de atualização inválido ou expirado');
        }
    }

    async logout(userId: string) {
        await this.usersService.updateRefreshToken(userId, null);
        await this.auditService.log({
            userId,
            action: 'LOGOUT',
            entity: 'User',
            entityId: userId,
        });
    }
}
