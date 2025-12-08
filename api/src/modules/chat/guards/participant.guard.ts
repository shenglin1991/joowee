import { Injectable } from '@nestjs/common';
import { ChatService } from '../services/chat.service';
import { ConversationCacheService } from '../services/conversation-cache.service';

@Injectable()
export class ParticipantGuard {
    constructor(
        private chatService: ChatService,
        private cacheService: ConversationCacheService
    ) {}

    async isUserParticipant(
        userId: string,
        conversationId: string
    ): Promise<boolean> {
        let conversation = this.cacheService.get(conversationId);

        if (!conversation) {
            conversation = await this.chatService.getConversationById(
                conversationId
            );
            if (conversation) {
                this.cacheService.set(conversationId, conversation);
            }
        }

        if (!conversation) {
            return false;
        }

        return conversation.participants.some((p) => p.id === userId);
    }

    async verifyParticipantOrThrow(
        userId: string,
        conversationId: string
    ): Promise<void> {
        const isParticipant = await this.isUserParticipant(
            userId,
            conversationId
        );

        if (!isParticipant) {
            throw new Error('User is not a participant of this conversation');
        }
    }
}
