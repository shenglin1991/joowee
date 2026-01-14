import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.useWebSocketAdapter(new IoAdapter(app));

    // Ajouter le préfixe global /api
    app.setGlobalPrefix('api');

    // Activer la validation globale
    app.useGlobalPipes(new ValidationPipe());

    // Activer CORS
    app.enableCors({
        origin: [
            'http://37.187.218.143',
            'https://37.187.218.143',
            'http://adrien-sheng-lin.fr',
            'https://adrien-sheng-lin.fr',
            'http://www.adrien-sheng-lin.fr',
            'https://www.adrien-sheng-lin.fr',
            'http://localhost:4200', // Pour le développement local
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });

    await app.listen(3010);
    console.log('🚀 Server is running on http://localhost:3010');
}
bootstrap();
