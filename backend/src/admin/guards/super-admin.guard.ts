import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class SuperAdminGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException('Usuário não autenticado.');
        }

        if (user.role !== 'super_admin') {
            throw new ForbiddenException('Acesso negado. Requer privilégios de Super Admin.');
        }

        return true;
    }
}
