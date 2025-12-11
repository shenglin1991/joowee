import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (
    configService: ConfigService
): TypeOrmModuleOptions => ({
    type: 'mysql',
    host: configService.get<string>('DB_HOST', '127.0.0.1'),
    port: configService.get<number>('DB_PORT', 3307),
    username: configService.get<string>('DB_USERNAME', 'root'),
    password: configService.get<string>('DB_PASSWORD', 'root'),
    database: configService.get<string>('DB_DATABASE', 'demo_angular_20'),
    autoLoadEntities: true,
    synchronize: true,
    logging: false,
});
