import { Injectable } from '@angular/core';
import { Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root',
})
export class WebSocketConnectionHandler {
  setupListeners(socket: Socket): void {
    socket.on('connect_error', (error) => {
      console.error('❌ Erreur de connexion WebSocket:', error);
    });

    socket.on('connect', () => {
      socket.emit('get_conversations');
    });

    socket.on('disconnect', (reason) => {
      if (reason !== 'io client disconnect') {
        console.warn('⚠️ Déconnecté du serveur:', reason);
      }
    });

    // Log quand l'utilisateur est identifié côté serveur
    socket.on('user_connected', (data: { userId: string; username: string }) => {
      console.log('👤 Utilisateur connecté:', data);
    });
  }
}
