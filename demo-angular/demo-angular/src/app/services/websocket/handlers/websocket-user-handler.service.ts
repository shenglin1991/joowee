import { Injectable, WritableSignal } from '@angular/core';
import { Socket } from 'socket.io-client';
import { User } from '../../../models';

@Injectable({
  providedIn: 'root',
})
export class WebSocketUserHandler {
  setupListeners(socket: Socket, onlineUsers: WritableSignal<User[]>): void {
    socket.on('users_online', (users: User[]) => {
      onlineUsers.set(users ?? []);
    });
  }
}
