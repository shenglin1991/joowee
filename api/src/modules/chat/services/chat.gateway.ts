import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../../auth/services/auth.service';
import { ChatService } from './chat.service';
import { SendMessageDto } from '../dto/send-message.dto';
import { StartConversationDto } from '../dto/chat.dto';
import { ConversationCacheService } from './conversation-cache.service';
import { NotificationQueueService } from './notification-queue.service';
import { SocketConnectionManager } from './socket-connection-manager.service';
import { ParticipantGuard } from '../guards/participant.guard';

@WebSocketGateway({
    namespace: '/api/chat',
    cors: {
            origin: '*',
	    credentials: true,
    },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(
        private authService: AuthService,
        private chatService: ChatService,
        private cacheService: ConversationCacheService,
        private notificationService: NotificationQueueService,
        private socketManager: SocketConnectionManager,
        private participantGuard: ParticipantGuard
    ) {}

    afterInit() {
        // Initialiser le service de notification avec le server et le socket manager
        this.notificationService.initialize(
            this.server,
            this.socketManager.getAllUserSockets()
        );
    }

    /**
     * Gestionnaire de connexion WebSocket
     *
     * Étapes:
     * 1. Vérifier la présence du token d'authentification
     * 2. Valider et décoder le token JWT
     * 3. Enregistrer la connexion socket de l'utilisateur
     * 4. Mettre à jour le statut en ligne de l'utilisateur
     * 5. Notifier tous les clients de la liste des utilisateurs en ligne
     * 6. Envoyer les conversations de l'utilisateur connecté
     */
    async handleConnection(client: Socket) {
            console.log('🔌 New connection attempt:', client.id);
	    try {
            const token = client.handshake.auth.token;
	    console.log('🔑 Token present:', !!token);

            // Étape 1: Vérifier le token
            if (!token) {
                console.log('❌ Connection rejected: No token');
                client.disconnect();
                return;
            }

            // Étape 2: Valider le token
            const payload = await this.authService.verifyToken(token);
            const userId = payload.sub;
	    console.log('🔑 Token payload:', payload);
	    console.log('👤 User ID:', payload.sub);

            // Étape 3: Enregistrer la connexion
            this.socketManager.registerUser(userId, client.id);
            client.data.userId = userId;

            console.log('✅ User connected:', userId);

            // Étape 4: Mettre à jour le statut en ligne
            await this.chatService.setUserOnlineStatus(userId, true);

            // Étape 5: Notifier les utilisateurs en ligne
            const onlineUsers = await this.chatService.getOnlineUsers();
            this.server.emit('users_online', onlineUsers);
            console.log('📡 Emitted users_online:', onlineUsers.length);

            // Étape 6: Envoyer les conversations
            const conversations = await this.chatService.getConversations(
                userId
            );
            client.emit('conversations_updated', conversations);
            console.log(
                '📡 Emitted conversations_updated:',
                conversations.length
            );
        } catch (error) {
            console.error('❌ Connection error:', error);
            client.disconnect();
        }
    }

    /**
     * Gestionnaire de déconnexion WebSocket
     *
     * Étapes:
     * 1. Récupérer l'ID utilisateur de la socket
     * 2. Supprimer l'enregistrement de la connexion
     * 3. Mettre à jour le statut hors ligne
     * 4. Notifier tous les clients de la mise à jour des utilisateurs en ligne
     */
    async handleDisconnect(client: Socket) {
        const userId = client.data.userId;

        if (userId) {
            // Étape 2: Supprimer la connexion
            this.socketManager.unregisterUser(userId);

            // Étape 3: Mettre à jour le statut
            await this.chatService.setUserOnlineStatus(userId, false);

            console.log('👋 User disconnected:', userId);

            // Étape 4: Notifier les utilisateurs en ligne
            const onlineUsers = await this.chatService.getOnlineUsers();
            this.server.emit('users_online', onlineUsers);
        }
    }

    /**
     * Gestionnaire pour l'envoi d'un message
     *
     * Étapes:
     * 1. Récupérer la conversation du cache ou de la DB
     * 2. Vérifier que l'utilisateur est participant
     * 3. Sauvegarder le message en base de données
     * 4. Récupérer le message complet avec relations
     * 5. Émettre le nouveau message à tous les participants (room)
     * 6. Invalider le cache de la conversation
     * 7. Mettre en file d'attente les notifications pour les participants
     */
    @SubscribeMessage('send_message')
    async handleSendMessage(
        @MessageBody() data: SendMessageDto,
        @ConnectedSocket() client: Socket
    ) {
        const userId = client.data.userId;
        console.log('📨 send_message received:', {
            userId,
            conversationId: data.conversationId,
        });

        // Étape 1: Récupérer la conversation
        let conversation = this.cacheService.get(data.conversationId);

        if (!conversation) {
            conversation = await this.chatService.getConversationById(
                data.conversationId
            );
            if (conversation) {
                this.cacheService.set(data.conversationId, conversation);
            }
        }

        // Étape 2: Vérifier les permissions
        if (
            !conversation ||
            !conversation.participants.some((p: any) => p.id === userId)
        ) {
            console.log('❌ User not participant or conversation not found');
            return;
        }

        // Étape 3: Sauvegarder le message
        const message = await this.chatService.sendMessage(userId, data);

        // Étape 4: Récupérer le message complet
        const fullMessage = await this.chatService.getMessageById(message.id);

        // Étape 5: Émettre aux participants
        console.log('📤 Emitting new_message to room:', data.conversationId);
        this.server.to(data.conversationId).emit('new_message', fullMessage);

        // Étape 6: Invalider le cache
        this.cacheService.invalidate(data.conversationId);

        // Étape 7: Notifier les participants
        await this.notificationService.notifyConversationParticipants(
            conversation
        );
    }

    /**
     * Gestionnaire pour rejoindre une conversation
     *
     * Étapes:
     * 1. Récupérer la conversation du cache ou de la DB
     * 2. Vérifier que l'utilisateur est participant
     * 3. Faire rejoindre l'utilisateur à la room Socket.IO
     * 4. Émettre l'événement conversation_joined au client
     */
    @SubscribeMessage('join_conversation')
    async handleJoinConversation(
        @MessageBody() conversationId: string,
        @ConnectedSocket() client: Socket
    ) {
        const userId = client.data.userId;
        console.log('🚪 join_conversation received:', {
            userId,
            conversationId,
        });

        // Étape 1: Récupérer la conversation
        let conversation = this.cacheService.get(conversationId);

        if (!conversation) {
            conversation = await this.chatService.getConversationById(
                conversationId
            );
            if (conversation) {
                this.cacheService.set(conversationId, conversation);
            }
        }

        // Étape 2: Vérifier les permissions
        if (
            !conversation ||
            !conversation.participants.some((p: any) => p.id === userId)
        ) {
            console.log('❌ User not participant or conversation not found');
            return;
        }

        // Étape 3: Rejoindre la room
        client.join(conversationId);

        // Étape 4: Confirmer au client
        client.emit('conversation_joined', conversation);
        console.log('✅ User joined conversation:', conversationId);
    }

    /**
     * Gestionnaire pour quitter une conversation
     *
     * Étapes:
     * 1. Retirer l'utilisateur de la room Socket.IO
     */
    @SubscribeMessage('leave_conversation')
    async handleLeaveConversation(
        @MessageBody() conversationId: string,
        @ConnectedSocket() client: Socket
    ) {
        // Étape 1: Quitter la room
        client.leave(conversationId);
    }

    /**
     * Gestionnaire pour démarrer une nouvelle conversation
     *
     * Étapes:
     * 1. Créer ou récupérer la conversation existante
     * 2. Mettre la conversation en cache
     * 3. Faire rejoindre l'initiateur à la room
     * 4. Émettre conversation_started à l'initiateur
     * 5. Mettre en file la notification pour l'initiateur
     * 6. Si l'autre utilisateur est en ligne:
     *    - Le faire rejoindre la room
     *    - Lui émettre conversation_started
     *    - Mettre en file sa notification
     */
    @SubscribeMessage('start_conversation')
    async handleStartConversation(
        @MessageBody() data: StartConversationDto,
        @ConnectedSocket() client: Socket
    ) {
        const userId = client.data.userId;
        console.log('🆕 start_conversation received:', {
            userId,
            otherUserId: data.userId,
        });

        // Étape 1: Créer/récupérer la conversation
        const conversation = await this.chatService.startConversation(
            userId,
            data.userId
        );

        // Étape 2: Mettre en cache
        this.cacheService.set(conversation.id, conversation);

        // Étape 3: Faire rejoindre l'initiateur
        client.join(conversation.id);

        // Étape 4: Émettre à l'initiateur
        client.emit('conversation_started', conversation);
        console.log('📤 Emitted conversation_started to initiator');

        // Étape 5: Notifier l'initiateur
        this.notificationService.queueNotification(userId, conversation.id);

        // Étape 6: Gérer l'autre utilisateur
        const otherUserSocketId = this.socketManager.getUserSocketId(
            data.userId
        );
        if (otherUserSocketId) {
            this.server.to(otherUserSocketId).socketsJoin(conversation.id);
            this.server
                .to(otherUserSocketId)
                .emit('conversation_started', conversation);
            console.log('📤 Emitted conversation_started to other user');

            this.notificationService.queueNotification(
                data.userId,
                conversation.id
            );
        }
    }

    /**
     * Gestionnaire pour marquer un message comme lu
     *
     * Étapes:
     * 1. Récupérer le message par son ID
     * 2. Vérifier que l'utilisateur est participant de la conversation
     * 3. Marquer le message comme lu
     * 4. Invalider le cache de la conversation
     * 5. Récupérer la conversation mise à jour
     * 6. Mettre en cache et notifier les participants
     */
    @SubscribeMessage('mark_as_read')
    async handleMarkAsRead(
        @MessageBody() messageId: string,
        @ConnectedSocket() client: Socket
    ) {
        const userId = client.data.userId;

        // Étape 1: Récupérer le message
        const message = await this.chatService.getMessageById(messageId);

        if (!message) {
            return;
        }

        // Étape 2: Vérifier les permissions
        if (
            !(await this.participantGuard.isUserParticipant(
                userId,
                message.conversationId
            ))
        ) {
            return;
        }

        // Étape 3: Marquer comme lu
        await this.chatService.markAsRead(messageId);

        // Étape 4: Invalider le cache
        this.cacheService.invalidate(message.conversationId);

        // Étape 5: Récupérer la conversation mise à jour
        let conversation = await this.chatService.getConversationById(
            message.conversationId
        );

        // Étape 6: Mettre en cache et notifier
        if (conversation) {
            this.cacheService.set(message.conversationId, conversation);
            await this.notificationService.notifyConversationParticipants(
                conversation
            );
        }
    }

    /**
     * Gestionnaire pour récupérer les messages d'une conversation
     *
     * Étapes:
     * 1. Vérifier que l'utilisateur est participant
     * 2. Récupérer tous les messages de la conversation
     * 3. Émettre les messages au client
     */
    @SubscribeMessage('get_messages')
    async handleGetMessages(
        @MessageBody() conversationId: string,
        @ConnectedSocket() client: Socket
    ) {
        const userId = client.data.userId;
        console.log('📥 get_messages received:', { userId, conversationId });

        // Étape 1: Vérifier les permissions
        if (
            !(await this.participantGuard.isUserParticipant(
                userId,
                conversationId
            ))
        ) {
            console.log('❌ User not participant');
            return;
        }

        // Étape 2: Récupérer les messages
        const messages = await this.chatService.getMessagesByConversation(
            conversationId
        );

        // Étape 3: Émettre au client
        client.emit('conversation_messages', {
            conversationId,
            messages,
        });
        console.log(
            '📤 Emitted conversation_messages:',
            messages.length,
            'messages'
        );
    }

    /**
     * Gestionnaire pour récupérer toutes les conversations d'un utilisateur
     *
     * Étapes:
     * 1. Récupérer les conversations de l'utilisateur
     * 2. Émettre la liste au client
     */
    @SubscribeMessage('get_conversations')
    async handleGetConversations(@ConnectedSocket() client: Socket) {
        const userId = client.data.userId;
        console.log('📥 get_conversations received:', userId);

        // Étape 1: Récupérer les conversations
        const conversations = await this.chatService.getConversations(userId);

        // Étape 2: Émettre au client
        client.emit('conversations_updated', conversations);
        console.log(
            '📤 Emitted conversations_updated:',
            conversations.length,
            'conversations'
        );
    }

    /**
     * Gestionnaire pour récupérer tous les messages de toutes les conversations
     *
     * Étapes:
     * 1. Récupérer toutes les conversations de l'utilisateur
     * 2. Pour chaque conversation, récupérer ses messages
     * 3. Agréger tous les messages
     * 4. Émettre l'historique complet au client
     */
    @SubscribeMessage('get_all_messages')
    async handleGetAllMessages(@ConnectedSocket() client: Socket) {
        const userId = client.data.userId;
        console.log('📥 get_all_messages received:', userId);

        // Étape 1: Récupérer les conversations
        const conversations = await this.chatService.getConversations(userId);

        // Étape 2 & 3: Récupérer et agréger les messages
        const allMessages = [];
        for (const conversation of conversations) {
            const messages = await this.chatService.getMessagesByConversation(
                conversation.id
            );
            allMessages.push(...messages);
        }

        // Étape 4: Émettre l'historique
        client.emit('messages_history', allMessages);
        console.log(
            '📤 Emitted messages_history:',
            allMessages.length,
            'messages'
        );
    }
}
