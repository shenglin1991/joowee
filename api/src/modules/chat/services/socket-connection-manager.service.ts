import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class SocketConnectionManager {
    private userSockets: Map<string, string> = new Map();

    registerUser(userId: string, socketId: string): void {
        this.userSockets.set(userId, socketId);
    }

    unregisterUser(userId: string): void {
        this.userSockets.delete(userId);
    }

    getUserSocketId(userId: string): string | undefined {
        return this.userSockets.get(userId);
    }

    getUserIdFromSocket(client: Socket): string | undefined {
        return client.data.userId;
    }

    getAllUserSockets(): Map<string, string> {
        return this.userSockets;
    }

    clear(): void {
        this.userSockets.clear();
    }
}
