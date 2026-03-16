import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { AppModule } from './app.module';
import * as express from 'express';
import * as path from 'path';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Static files (kiosk)
    app.use(express.static(path.join(process.cwd(), 'public')));

    // Validação global
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    const reflector = app.get(Reflector);
    app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

    // CORS - Configuração mais robusta para produção
    const frontendUrl = process.env.FRONTEND_URL;
    const allowedOrigins = frontendUrl
        ? frontendUrl.split(',').map(u => u.trim())
        : ['https://os4u.com.br', 'https://ordem-de-servico.pages.dev', 'http://localhost:5173'];

    app.enableCors({
        origin: (origin, callback) => {
            // Em produção, se allowedOrigins for '*', permite tudo
            if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
                callback(null, true);
            } else {
                console.warn(`[CORS] Bloqueado origin: ${origin}`);
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
        allowedHeaders: 'Content-Type,Authorization,x-tenant-id',
    });

    // Health check endpoint
    const httpAdapter = app.getHttpAdapter();
    httpAdapter.get('/health', (_req: any, res: any) => res.json({ status: 'ok', ts: new Date() }));

    const port = process.env.PORT || 3005;
    await app.listen(port, '0.0.0.0');
    console.log(`🚀 OS4U rodando em: http://0.0.0.0:${port}`);
}
bootstrap();
