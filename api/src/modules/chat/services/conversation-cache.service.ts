import { Injectable } from '@nestjs/common';
import { Conversation } from '../entities/conversation.entity';

interface CacheEntry {
    data: Conversation;
    timestamp: number;
}

@Injectable()
export class ConversationCacheService {
    private cache: Map<string, CacheEntry> = new Map();
    private readonly CACHE_TTL = 5000; // 5 seconds

    get(conversationId: string): Conversation | null {
        const cached = this.cache.get(conversationId);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.data;
        }
        this.cache.delete(conversationId);
        return null;
    }

    set(conversationId: string, conversation: Conversation): void {
        this.cache.set(conversationId, {
            data: conversation,
            timestamp: Date.now(),
        });
    }

    invalidate(conversationId: string): void {
        this.cache.delete(conversationId);
    }

    clear(): void {
        this.cache.clear();
    }
}
