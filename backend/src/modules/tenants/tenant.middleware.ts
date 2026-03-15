import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        // Extrair tenantId do header x-tenant-id ou do JWT (já injetado pelo guard)
        const tenantId = req.headers['x-tenant-id'] as string;
        if (tenantId) {
            (req as any).tenantId = tenantId;
        }
        next();
    }
}
