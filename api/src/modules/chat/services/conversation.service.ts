import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../entities/conversation.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class ConversationService {
    constructor(
        @InjectRepository(Conversation)
        private conversationRepository: Repository<Conversation>
    ) {}

    async getConversations(user_id: string): Promise<Conversation[]> {
        const query = `
            SELECT DISTINCT c.*
            FROM conversations c
            INNER JOIN conversation_users cpu ON c.id = cpu.conversation_id
            WHERE cpu.user_id = ?
            ORDER BY c.updatedAt DESC
        `;

        const conversations = await this.conversationRepository.query(query, [
            user_id,
        ]);

        // Charger les participants pour chaque conversation
        for (const conv of conversations) {
            const participants = await this.conversationRepository.query(
                `
                SELECT u.*
                FROM users u
                INNER JOIN conversation_users cpu ON u.id = cpu.user_id
                WHERE cpu.conversation_id = ?
                `,
                [conv.id]
            );
            conv.participants = participants;
        }

        return conversations;
    }

    async findExistingConversation(
        user_id: string,
        otheruser_id: string
    ): Promise<Conversation | null> {
        const query = `
            SELECT c.*
            FROM conversations c
            INNER JOIN conversation_users cpu1 ON c.id = cpu1.conversation_id
            INNER JOIN conversation_users cpu2 ON c.id = cpu2.conversation_id
            WHERE cpu1.user_id = ?
            AND cpu2.user_id = ?
            AND (
                SELECT COUNT(DISTINCT user_id)
                FROM conversation_users
                WHERE conversation_id = c.id
            ) = 2
            LIMIT 1
        `;

        const conversations = await this.conversationRepository.query(query, [
            user_id,
            otheruser_id,
        ]);

        if (conversations.length === 0) {
            return null;
        }

        const conversation = conversations[0];

        // Charger les participants
        const participants = await this.conversationRepository.query(
            `
            SELECT u.*
            FROM users u
            INNER JOIN conversation_users cpu ON u.id = cpu.user_id
            WHERE cpu.conversation_id = ?
            `,
            [conversation.id]
        );

        conversation.participants = participants;

        return conversation;
    }

    async reloadWithParticipants(
        conversationId: string
    ): Promise<Conversation> {
        const conversation = await this.conversationRepository.findOne({
            where: { id: conversationId },
            relations: ['participants'],
        });

        if (!conversation) {
            throw new Error('Conversation not found');
        }

        return conversation;
    }

    async createConversation(
        user: User,
        otherUser: User
    ): Promise<Conversation> {
        const conversation = this.conversationRepository.create();
        conversation.participants = [user, otherUser];
        return this.conversationRepository.save(conversation);
    }

    async getConversationById(
        conversationId: string
    ): Promise<Conversation | null> {
        const query = `
            SELECT c.*
            FROM conversations c
            WHERE c.id = ?
        `;

        const conversations = await this.conversationRepository.query(query, [
            conversationId,
        ]);

        if (conversations.length === 0) {
            return null;
        }

        const conversation = conversations[0];

        // Charger les participants
        const participants = await this.conversationRepository.query(
            `
            SELECT u.*
            FROM users u
            INNER JOIN conversation_users cpu ON u.id = cpu.user_id
            WHERE cpu.conversation_id = ?
            `,
            [conversationId]
        );

        conversation.participants = participants;

        return conversation;
    }
}
