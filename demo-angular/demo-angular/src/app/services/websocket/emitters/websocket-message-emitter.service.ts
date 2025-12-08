import { Injectable } from '@angular/core';
import { Socket } from 'socket.io-client';
import { Nullable } from '../../../models';

@Injectable({
  providedIn: 'root',
})
export class WebSocketMessageEmitter {
  sendMessage(socket: Nullable<Socket>, conversationId: string, content: string): void {
    if (!socket) {
      console.error('❌ Socket is null, cannot send message');
      return;
    }

    socket.emit('send_message', {
      conversationId,
      content,
      timestamp: new Date(),
    });
  }

  markMessageAsRead(socket: Nullable<Socket>, messageId: string): void {
    if (!socket) return;
    socket.emit('mark_as_read', messageId);
  }
}
