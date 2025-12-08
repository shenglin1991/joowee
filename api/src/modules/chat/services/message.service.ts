import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../entities/message.entity';
import { SendMessageDto } from '../dto/send-message.dto';

@Injectable()
export class MessageService {
    constructor(
        @InjectRepository(Message)
        private messageRepository: Repository<Message>
    ) {}

    /**
     * Envoie un nouveau message dans une conversation
     *
     * Étapes:
     * 1. Extraire le contenu et l'ID de conversation du DTO
     * 2. Créer une nouvelle entité Message avec les données
     * 3. Marquer le message comme non lu par défaut
     * 4. Sauvegarder le message en base de données
     * 5. Retourner le message créé
     */
    async sendMessage(
        userId: string,
        sendMessageDto: SendMessageDto
    ): Promise<Message> {
        const { conversationId, content } = sendMessageDto;

        // Créer l'entité message
        const message = this.messageRepository.create({
            content,
            senderId: userId,
            conversationId,
            isRead: false,
        });

        // Sauvegarder en base de données
        return this.messageRepository.save(message);
    }

    /**
     * Marque un message comme lu
     *
     * Étapes:
     * 1. Trouver le message par son ID
     * 2. Mettre à jour le champ isRead à true
     */
    async markAsRead(messageId: string): Promise<void> {
        await this.messageRepository.update(messageId, { isRead: true });
    }

    /**
     * Récupère un message par son ID avec ses relations
     *
     * Étapes:
     * 1. Chercher le message par ID
     * 2. Charger les relations: sender (expéditeur) et conversation
     * 3. Retourner le message complet ou null si non trouvé
     */
    async getMessageById(messageId: string): Promise<Message | null> {
        return this.messageRepository.findOne({
            where: { id: messageId },
            relations: ['sender', 'conversation'],
        });
    }

    /**
     * Récupère tous les messages d'une conversation spécifique
     *
     * Étapes:
     * 1. Filtrer les messages par conversationId
     * 2. Charger la relation sender pour chaque message
     * 3. Trier par timestamp croissant (ordre chronologique)
     * 4. Retourner la liste des messages
     */
    async getMessagesByConversation(
        conversationId: string
    ): Promise<Message[]> {
        return this.messageRepository.find({
            where: { conversationId },
            relations: ['sender'],
            order: { timestamp: 'ASC' },
        });
    }

    /**
     * Récupère tous les messages de toutes les conversations
     *
     * Étapes:
     * 1. Récupérer tous les messages
     * 2. Charger les relations sender et conversation
     * 3. Trier par timestamp croissant
     * 4. Retourner la liste complète
     */
    async getAllMessages(): Promise<Message[]> {
        return this.messageRepository.find({
            relations: ['sender', 'conversation'],
            order: { timestamp: 'ASC' },
        });
    }

    /**
     * Récupère tous les messages envoyés par un utilisateur
     *
     * Étapes:
     * 1. Filtrer les messages par senderId
     * 2. Charger les relations sender et conversation
     * 3. Trier par timestamp croissant
     * 4. Retourner les messages de l'utilisateur
     */
    async getMessagesByUser(userId: string): Promise<Message[]> {
        return this.messageRepository.find({
            where: { senderId: userId },
            relations: ['sender', 'conversation'],
            order: { timestamp: 'ASC' },
        });
    }
}
