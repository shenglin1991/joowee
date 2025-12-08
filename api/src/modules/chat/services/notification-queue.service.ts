import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Server } from 'socket.io';
import { ChatService } from './chat.service';

@Injectable()
export class NotificationQueueService implements OnModuleDestroy {
    private notificationQueue: Map<string, Set<string>> = new Map();
    private notificationTimer: NodeJS.Timeout | null = null;
    private readonly DEBOUNCE_MS = 100;
    private server: Server | null = null;
    private userSockets: Map<string, string> | null = null;

    constructor(private chatService: ChatService) {}

    initialize(server: Server, userSockets: Map<string, string>): void {
        this.server = server;
        this.userSockets = userSockets;
    }

    queueNotification(userId: string, conversationId: string): void {
        if (!this.notificationQueue.has(userId)) {
            this.notificationQueue.set(userId, new Set());
        }
        this.notificationQueue.get(userId)!.add(conversationId);

        if (!this.notificationTimer) {
            this.notificationTimer = setTimeout(() => {
                this.flush();
            }, this.DEBOUNCE_MS);
        }
    }

    async notifyConversationParticipants(conversation: {
        id: string;
        participants: Array<{ id: string }>;
    }): Promise<void> {
        for (const participant of conversation.participants) {
            this.queueNotification(participant.id, conversation.id);
        }
    }

    async flush(): Promise<void> {
        if (!this.server || !this.userSockets) {
            this.notificationQueue.clear();
            this.notificationTimer = null;
            return;
        }

        const queue = new Map(this.notificationQueue);
        this.notificationQueue.clear();
        this.notificationTimer = null;

        for (const [userId, conversationIds] of queue) {
            const socketId = this.userSockets.get(userId);
            if (socketId) {
                const conversations = await this.chatService.getConversations(
                    userId
                );
                this.server
                    .to(socketId)
                    .emit('conversations_updated', conversations);
            }
        }
    }

    onModuleDestroy(): void {
        this.clear();
    }

    clear(): void {
        if (this.notificationTimer) {
            clearTimeout(this.notificationTimer);
            this.notificationTimer = null;
        }
        this.notificationQueue.clear();
    }
}
