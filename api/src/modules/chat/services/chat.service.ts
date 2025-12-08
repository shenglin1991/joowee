import { Injectable } from '@nestjs/common';
import { Conversation } from '../entities/conversation.entity';
import { User } from '../entities/user.entity';
import { SendMessageDto } from '../dto/send-message.dto';
import { Message } from '../entities/message.entity';
import { ConversationService } from './conversation.service';
import { MessageService } from './message.service';
import { UserService } from './user.service';

@Injectable()
export class ChatService {
    constructor(
        private conversationService: ConversationService,
        private messageService: MessageService,
        private userService: UserService
    ) {}

    async sendMessage(
        userId: string,
        sendMessageDto: SendMessageDto
    ): Promise<Message> {
        return this.messageService.sendMessage(userId, sendMessageDto);
    }

    async getConversations(userId: string): Promise<Conversation[]> {
        return this.conversationService.getConversations(userId);
    }

    async startConversation(
        userId: string,
        otherUserId: string
    ): Promise<Conversation> {
        // First check if conversation already exists
        const existingConversation =
            await this.conversationService.findExistingConversation(
                userId,
                otherUserId
            );

        if (existingConversation) {
            return existingConversation;
        }

        const [user, otherUser] = await this.userService.findUsersByIds(
            userId,
            otherUserId
        );

        const conversation = await this.conversationService.createConversation(
            user,
            otherUser
        );

        return conversation;
    }

    async markAsRead(messageId: string): Promise<void> {
        return this.messageService.markAsRead(messageId);
    }

    async getOnlineUsers(): Promise<Partial<User>[]> {
        return this.userService.getOnlineUsers();
    }

    async setUserOnlineStatus(
        userId: string,
        isOnline: boolean
    ): Promise<void> {
        return this.userService.setUserOnlineStatus(userId, isOnline);
    }

    async getMessageById(messageId: string): Promise<Message | null> {
        return this.messageService.getMessageById(messageId);
    }

    async getUsers(): Promise<Partial<User>[]> {
        return this.userService.getUsers();
    }

    async getMessagesByConversation(
        conversationId: string
    ): Promise<Message[]> {
        return this.messageService.getMessagesByConversation(conversationId);
    }

    async getConversationById(
        conversationId: string
    ): Promise<Conversation | null> {
        return this.conversationService.getConversationById(conversationId);
    }
}
