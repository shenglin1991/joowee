import { User } from '../entities/user.entity';

export function sanitizeUser(user: User): Partial<User> {
    const { password, createdAt, ...rest } = user;
    return rest;
}
