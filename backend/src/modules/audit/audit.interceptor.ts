import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
    private readonly logger = new Logger(AuditInterceptor.name);

    constructor(private auditService: AuditService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest();
        const method = req.method;
        const url = req.url;

        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
            return next.handle().pipe(
                tap({
                    next: () => {
                        const user = req.user;
                        const userId = user?.id || null;
                        const resource = context.getClass().name.replace('Controller', '');
                        const details = {
                            method,
                            url,
                            body: this.sanitize(req.body),
                            query: req.query,
                            params: req.params
                        };
                        const id = req.params.id || null;

                        this.auditService.log(
                            userId,
                            method,
                            resource,
                            id,
                            details,
                            req.ip || req.connection.remoteAddress
                        );
                    },
                    error: (err) => {
                        // Optional: Log failures too?
                    }
                })
            );
        }
        return next.handle();
    }

    private sanitize(body: any): any {
        if (!body || typeof body !== 'object') return body;
        const sanitized = { ...body };
        if (sanitized.password) sanitized.password = '***';
        // Remove potentially large fields if needed
        return sanitized;
    }
}
