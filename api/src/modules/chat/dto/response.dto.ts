import { User } from '../entities/user.entity';
import { Message } from '../entities/message.entity';
import { Conversation } from '../entities/conversation.entity';

// Response DTOs - Pour les réponses typées du backend

export class UserResponseDto {
    id: string;
    username: string;
    isOnline: boolean;
    lastSeen?: Date;

    constructor(user: User) {
        this.id = user.id;
        this.username = user.username;
        this.isOnline = user.isOnline;
        this.lastSeen = user.lastSeen;
    }
}

export class MessageResponseDto {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    timestamp: Date;
    isRead: boolean;
    sender?: UserResponseDto;

    constructor(message: Message) {
        this.id = message.id;
        this.conversationId = message.conversationId;
        this.senderId = message.senderId;
        this.content = message.content;
        this.timestamp = message.timestamp;
        this.isRead = message.isRead;
        if (message.sender) {
            this.sender = new UserResponseDto(message.sender);
        }
    }
}

export class ConversationResponseDto {
    id: string;
    participants: UserResponseDto[];
    lastMessage?: MessageResponseDto;
    unreadCount: number;
    updatedAt: Date;
    createdAt: Date;

    constructor(conversation: Conversation, unreadCount = 0) {
        this.id = conversation.id;
        this.participants = conversation.participants.map(
            (p) => new UserResponseDto(p)
        );
        this.unreadCount = unreadCount;
        this.updatedAt = conversation.updatedAt;
        this.createdAt = conversation.createdAt;

        // Trouver le dernier message si disponible
        if (conversation.messages && conversation.messages.length > 0) {
            const lastMsg = conversation.messages.sort(
                (a, b) =>
                    new Date(b.timestamp).getTime() -
                    new Date(a.timestamp).getTime()
            )[0];
            this.lastMessage = new MessageResponseDto(lastMsg);
        }
    }
}

export class ConversationMessagesResponseDto {
    conversationId: string;
    messages: MessageResponseDto[];

    constructor(conversationId: string, messages: Message[]) {
        this.conversationId = conversationId;
        this.messages = messages.map((m) => new MessageResponseDto(m));
    }
}
