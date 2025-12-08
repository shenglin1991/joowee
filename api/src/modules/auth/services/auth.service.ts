import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../../chat/entities/user.entity';
import { LoginDto } from '../dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private jwtService: JwtService
    ) {}

    async login(loginDto: LoginDto) {
        const { username, password } = loginDto;

        let user = await this.userRepository.findOne({ where: { username } });

        if (!user) {
            // Créer un nouveau utilisateur si n'existe pas
            const hashedPassword = await bcrypt.hash(password, 10);
            user = this.userRepository.create({
                username,
                password: hashedPassword,
                isOnline: true,
            });
            await this.userRepository.save(user);
        } else {
            // Vérifier le mot de passe pour un utilisateur existant
            const isPasswordValid = await bcrypt.compare(
                password,
                user.password
            );
            if (!isPasswordValid) {
                throw new UnauthorizedException('Invalid credentials');
            }

            // Mettre à jour le statut en ligne
            user.isOnline = true;
            await this.userRepository.save(user);
        }

        const payload = { sub: user.id, username: user.username };
        const token = this.jwtService.sign(payload);

        return {
            token,
            user: {
                id: user.id,
                username: user.username,
                isOnline: user.isOnline,
                lastSeen: user.lastSeen,
            },
        };
    }

    async validateUser(userId: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { id: userId } });
    }

    async verifyToken(token: string) {
        try {
            return this.jwtService.verify(token);
        } catch (error) {
            throw new UnauthorizedException('Invalid token');
        }
    }
}
