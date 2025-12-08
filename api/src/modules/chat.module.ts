import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from './chat/entities/conversation.entity';
import { User } from './chat/entities/user.entity';
import { ChatService } from './chat/services/chat.service';
import { ChatGateway } from './chat/services/chat.gateway';
import { ConversationService } from './chat/services/conversation.service';
import { MessageService } from './chat/services/message.service';
import { UserService } from './chat/services/user.service';
import { AuthModule } from './auth/auth.module';
import { Message } from './chat/entities/message.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Message, Conversation, User]),
        AuthModule,
    ],
    providers: [
        ChatService,
        ChatGateway,
        ConversationService,
        MessageService,
        UserService,
    ],
    exports: [ChatService],
})
export class ChatModule {}
