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

    // CORS — lê do .env em produção, aceita tudo em dev
    const frontendUrl = process.env.FRONTEND_URL;
    const allowedOrigins = frontendUrl
        ? frontendUrl.split(',').map(u => u.trim())
        : true; // dev: aceita qualquer origem

    app.enableCors({
        origin: allowedOrigins,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });

    // Health check endpoint
    const httpAdapter = app.getHttpAdapter();
    httpAdapter.get('/health', (_req: any, res: any) => res.json({ status: 'ok', ts: new Date() }));

    const port = process.env.PORT || 3005;
    await app.listen(port, '0.0.0.0');
    console.log(`🚀 OS4U rodando em: http://0.0.0.0:${port}`);
}
bootstrap();
