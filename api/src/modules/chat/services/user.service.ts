import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { sanitizeUser } from '../helpers/user.helper';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>
    ) {}

    async getOnlineUsers(): Promise<Partial<User>[]> {
        const users = await this.userRepository.find({
            where: { isOnline: true },
        });
        return users.map(sanitizeUser);
    }

    async getUsers(): Promise<Partial<User>[]> {
        const users = await this.userRepository.find();
        return users.map(sanitizeUser);
    }

    async setUserOnlineStatus(
        userId: string,
        isOnline: boolean
    ): Promise<void> {
        const updateData: Partial<User> = { isOnline };
        if (!isOnline) {
            updateData.lastSeen = new Date();
        }
        await this.userRepository.update(userId, updateData);
    }

    async findUsersByIds(
        userId: string,
        otherUserId: string
    ): Promise<[User, User]> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });
        const otherUser = await this.userRepository.findOne({
            where: { id: otherUserId },
        });

        if (!user || !otherUser) {
            throw new Error('User not found');
        }

        return [user, otherUser];
    }
}
