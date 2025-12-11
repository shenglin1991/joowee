import { Injectable } from '@angular/core';
import { Socket } from 'socket.io-client';
import { Nullable } from '../../../models';

@Injectable({
  providedIn: 'root',
})
export class WebSocketConversationEmitter {
  startConversation(socket: Nullable<Socket>, userId: string): void {
    if (!socket) {
      console.error('❌ Cannot start conversation: socket is null');
      return;
    }
    socket.emit('start_conversation', { userId });
  }

  joinConversation(socket: Nullable<Socket>, conversationId: string): void {
    if (!socket) return;
    socket.emit('join_conversation', conversationId);
    socket.emit('get_messages', conversationId);
  }

  leaveConversation(socket: Nullable<Socket>, conversationId: string): void {
    if (!socket) return;
    socket.emit('leave_conversation', conversationId);
  }
}
