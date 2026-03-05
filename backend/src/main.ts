import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { AppModule } from './app.module';
import * as express from 'express';
import * as path from 'path';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Serve static files (kiosk page for tablet self-registration)
    app.use(express.static(path.join(process.cwd(), 'public')));

    // Habilitar validação global
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        transform: true,
    }));

    // Habilitar serialização global (Exclude/Expose)
    const reflector = app.get(Reflector);
    app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

    // CORS para o frontend (Next.js/PWA)
    app.enableCors({
        origin: [
            'https://os4u.com.br',
            'https://www.os4u.com.br',
            'https://api.os4u.com.br',
            'http://localhost:5173',
            'http://localhost:5174',
            'http://100.114.52.65:5173',
            'http://192.168.100.28:5173',
            'http://192.168.100.28:5174'
        ],
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });

    const port = process.env.PORT || 3001;
    await app.listen(port, '0.0.0.0');
    console.log(`🚀 Sistema de Assistência Técnica rodando em: http://0.0.0.0:${port}`);
}
bootstrap();
