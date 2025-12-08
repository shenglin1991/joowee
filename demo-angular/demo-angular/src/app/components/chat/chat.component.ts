import { Component, OnInit, OnDestroy, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthResourceService } from '../../services/auth.resource.service';
import { WebSocketService } from '../../services/websocket.service';
import { Conversation, User, Nullable } from '../../models';
import { ChatHeaderComponent } from './chat-header/chat-header.component';
import { ConversationListComponent } from './conversation-list/conversation-list.component';
import { OnlineUsersComponent } from './online-users/online-users.component';
import { MessageAreaComponent } from './message-area/message-area.component';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    ChatHeaderComponent,
    ConversationListComponent,
    OnlineUsersComponent,
    MessageAreaComponent,
  ],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit, OnDestroy {
  // Injection de dépendances moderne
  private readonly authService = inject(AuthResourceService);
  private readonly webSocketService = inject(WebSocketService);
  private readonly router = inject(Router);

  // Signals pour l'état du composant
  currentUser = this.authService.currentUser;
  selectedConversation = signal<Nullable<Conversation>>(null);
  showUserList = signal(false);

  conversations = this.webSocketService.conversations;

  // Signal brut depuis le service
  allMessages = this.webSocketService.messages;
  allOnlineUsers = this.webSocketService.onlineUsers;

  // Computed signals pour les valeurs dérivées
  messages = computed(() => {
    const selectedConv = this.selectedConversation();
    if (!selectedConv) return [];
    return this.allMessages().filter((msg) => msg.conversationId === selectedConv.id);
  });

  onlineUsers = computed(() => {
    const current = this.currentUser();
    if (!current) return [];
    return this.allOnlineUsers().filter((user) => user.id !== current.id);
  });

  constructor() {
    effect(() => {
      const conversation = this.selectedConversation();
      if (conversation?.id) {
        this.webSocketService.joinConversation(conversation.id);
      }
    });

    effect(() => {
      const convs = this.conversations();
      const selected = this.selectedConversation();

      if (!selected && convs.length > 0) {
        const newest = convs[convs.length - 1];
        if (newest?.id) {
          this.selectedConversation.set(newest);
        }
      }
    });
  }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();

    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.webSocketService.connect();
  }

  ngOnDestroy(): void {
    this.webSocketService.disconnect();
  }

  onUserSelected(user: User): void {
    const existingConv = this.conversations().find((conv) => {
      if (!conv.participants || !Array.isArray(conv.participants)) return false;
      return conv.participants.some((p) => p?.id === user.id);
    });

    if (existingConv) {
      this.onConversationSelected(existingConv);
    } else {
      this.webSocketService.startConversation(user.id);
    }
    this.showUserList.set(false);
  }

  onConversationSelected(conversation: Nullable<Conversation>): void {
    const current = this.currentUser();
    if (conversation && current) {
      const isParticipant = conversation.participants?.some((p) => p?.id === current.id);

      if (!isParticipant) {
        console.error("❌ Tentative d'accès à une conversation non autorisée!");
        return;
      }
    }

    const previousConv = this.selectedConversation();
    if (previousConv?.id) {
      this.webSocketService.leaveConversation(previousConv.id);
    }

    if (conversation?.id) {
      this.selectedConversation.set(conversation);
    } else {
      this.selectedConversation.set(null);
    }
  }

  onMessageSent(content: string): void {
    const conversation = this.selectedConversation();
    if (conversation?.id) {
      this.webSocketService.sendMessage(conversation.id, content);
    }
  }

  onLogout(): void {
    this.webSocketService.disconnect();
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleUserList(): void {
    this.showUserList.update((value) => !value);
  }
}
