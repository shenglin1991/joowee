import { Injectable, WritableSignal } from '@angular/core';
import { Socket } from 'socket.io-client';
import { Conversation } from '../../../models';

@Injectable({
  providedIn: 'root',
})
export class WebSocketConversationHandler {
  setupListeners(socket: Socket, conversations: WritableSignal<Conversation[]>): void {
    socket.on('conversations_updated', (receivedConversations: Conversation[]) => {
      const validConversations = receivedConversations.filter((conv) => {
        if (
          !conv.participants ||
          !Array.isArray(conv.participants) ||
          conv.participants.length === 0
        ) {
          console.error('❌ Conversation sans participants valides:', conv.id);
          return false;
        }
        return true;
      });

      conversations.set(validConversations);
      socket.emit('get_all_messages');
    });

    socket.on('conversation_started', (conversation: Conversation) => {
      if (!conversation || !conversation.id) {
        console.error('❌ Conversation invalide reçue:', conversation);
        return;
      }

      if (!conversation.participants || conversation.participants.length < 2) {
        console.error('⚠️ Conversation créée sans les 2 participants!', conversation);
        return;
      }

      const list = conversations();
      const exists = list.some((c) => c.id === conversation.id);

      if (!exists) {
        conversations.set([...list, conversation]);
      } else {
        conversations.set(list.map((c) => (c.id === conversation.id ? conversation : c)));
      }
    });

    socket.on('conversation_joined', (conversation: Conversation) => {
      const list = conversations();
      const exists = list.some((c) => c.id === conversation.id);
      conversations.set(
        exists
          ? list.map((c) => (c.id === conversation.id ? conversation : c))
          : [...list, conversation]
      );
    });
  }
}
