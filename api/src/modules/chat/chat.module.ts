import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from './entities/conversation.entity';
import { User } from './entities/user.entity';
import { ChatService } from './services/chat.service';
import { ChatGateway } from './services/chat.gateway';
import { AuthModule } from '../auth/auth.module';
import { Message } from './entities/message.entity';
import { ConversationService } from './services/conversation.service';
import { MessageService } from './services/message.service';
import { UserService } from './services/user.service';
import { ConversationCacheService } from './services/conversation-cache.service';
import { NotificationQueueService } from './services/notification-queue.service';
import { SocketConnectionManager } from './services/socket-connection-manager.service';
import { ParticipantGuard } from './guards/participant.guard';

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
        ConversationCacheService,
        NotificationQueueService,
        SocketConnectionManager,
        ParticipantGuard,
    ],
    exports: [ChatService],
})
export class ChatModule {}
