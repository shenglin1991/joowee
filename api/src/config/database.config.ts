import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../modules/chat/entities/user.entity';
import { Conversation } from '../modules/chat/entities/conversation.entity';
import { Message } from '@/modules/chat/entities/message.entity';

export const getDatabaseConfig = (
    configService: ConfigService
): TypeOrmModuleOptions => ({
    type: 'mysql',
    host: configService.get<string>('DB_HOST', '127.0.0.1'),
    port: configService.get<number>('DB_PORT', 3307),
    username: configService.get<string>('DB_USERNAME', 'root'),
    password: configService.get<string>('DB_PASSWORD', 'root'),
    database: configService.get<string>('DB_DATABASE', 'demo_angular_20'),
    entities: [User, Message, Conversation],
    synchronize: true,
    logging: false,
});
