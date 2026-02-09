import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Habilitar validação global
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));

    // CORS para o frontend (Next.js/PWA)
    app.enableCors({
        origin: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });

    const port = process.env.PORT || 3001;
    await app.listen(port);
    console.log(`🚀 Sistema de Assistência Técnica rodando em: http://localhost:${port}`);
}
bootstrap();
