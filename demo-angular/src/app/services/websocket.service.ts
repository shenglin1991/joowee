import { inject, Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../config/api.config';
import { Message, Conversation, User } from '../models';
import { AuthResourceService } from './auth.resource.service';
import { WebSocketMessageHandler } from './websocket/handlers/websocket-message-handler.service';
import { WebSocketConversationHandler } from './websocket/handlers/websocket-conversation-handler.service';
import { WebSocketUserHandler } from './websocket/handlers/websocket-user-handler.service';
import { WebSocketConnectionHandler } from './websocket/handlers/websocket-connection-handler.service';
import { WebSocketConversationEmitter } from './websocket/emitters/websocket-conversation-emitter.service';
import { WebSocketMessageEmitter } from './websocket/emitters/websocket-message-emitter.service';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private socket: Socket | null = null;
  private readonly SERVER_URL = API_BASE_URL;

  private readonly authService = inject(AuthResourceService);

  // Handlers
  private readonly messageHandler = inject(WebSocketMessageHandler);
  private readonly conversationHandler = inject(WebSocketConversationHandler);
  private readonly userHandler = inject(WebSocketUserHandler);
  private readonly connectionHandler = inject(WebSocketConnectionHandler);

  // Emitters
  private readonly conversationEmitter = inject(WebSocketConversationEmitter);
  private readonly messageEmitter = inject(WebSocketMessageEmitter);

  // Signals
  messages = signal<Message[]>([]);
  conversations = signal<Conversation[]>([]);
  onlineUsers = signal<User[]>([]);

  // === CONNECTION ===

  connect(): void {
    const token = this.authService.getToken();
    if (!token) return;

    this.socket = io(this.SERVER_URL + '/chat', {
      auth: { token },
    });

    this.setupAllListeners();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // === CONVERSATIONS ===

  startConversation(userId: string): void {
    console.log('Starting conversation with userId:', userId);
    this.conversationEmitter.startConversation(this.socket, userId);
  }

  joinConversation(conversationId: string): void {
    this.conversationEmitter.joinConversation(this.socket, conversationId);
  }

  leaveConversation(conversationId: string): void {
    this.conversationEmitter.leaveConversation(this.socket, conversationId);
  }

  // === MESSAGES ===

  sendMessage(conversationId: string, content: string): void {
    this.messageEmitter.sendMessage(this.socket, conversationId, content);
  }

  markMessageAsRead(messageId: string): void {
    this.messageEmitter.markMessageAsRead(this.socket, messageId);
  }

  // === PRIVATE ===

  private setupAllListeners(): void {
    if (!this.socket) return;

    this.messageHandler.setupListeners(this.socket, this.messages, this.conversations);
    this.conversationHandler.setupListeners(this.socket, this.conversations);
    this.userHandler.setupListeners(this.socket, this.onlineUsers);
    this.connectionHandler.setupListeners(this.socket);
  }
}
