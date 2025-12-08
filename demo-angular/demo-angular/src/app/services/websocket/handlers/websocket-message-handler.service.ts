import { Injectable, WritableSignal } from '@angular/core';
import { Socket } from 'socket.io-client';
import { Message, Conversation } from '../../../models';

@Injectable({
  providedIn: 'root',
})
export class WebSocketMessageHandler {
  setupListeners(
    socket: Socket,
    messages: WritableSignal<Message[]>,
    conversations: WritableSignal<Conversation[]>
  ): void {
    socket.on('new_message', (message: Message) => {
      const knownConvIds = new Set(conversations().map((c) => c.id));

      if (!knownConvIds.has(message.conversationId)) {
        console.warn("⚠️ Message d'une conversation non autorisée:", message.conversationId);
        socket.emit('get_conversations');
        return;
      }

      const currentMessages = messages();
      messages.set([...currentMessages, message]);
    });

    socket.on('messages_history', (receivedMessages: Message[]) => {
      const knownConvIds = new Set(conversations().map((c) => c.id));
      const validMessages = receivedMessages.filter((msg) => knownConvIds.has(msg.conversationId));
      messages.set(validMessages);
    });

    socket.on('conversation_messages', (data: { conversationId: string; messages: Message[] }) => {
      const knownConvIds = new Set(conversations().map((c) => c.id));

      if (!knownConvIds.has(data.conversationId)) {
        console.error(
          "❌ Tentative de charger des messages d'une conversation non autorisée:",
          data.conversationId
        );
        return;
      }

      const currentMessages = messages();
      const otherMessages = currentMessages.filter((m) => m.conversationId !== data.conversationId);
      messages.set([...otherMessages, ...(data.messages ?? [])]);
    });
  }
}
