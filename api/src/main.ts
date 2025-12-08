import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.useWebSocketAdapter(new IoAdapter(app));

    // Activer la validation globale
    app.useGlobalPipes(new ValidationPipe());

    // Activer CORS
    app.enableCors({
	origin: '*',        
	credentials: true,
    });

    await app.listen(3010);
    console.log('🚀 Server is running on http://localhost:3010');
}
bootstrap();
