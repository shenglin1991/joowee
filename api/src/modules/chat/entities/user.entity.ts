import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    OneToMany,
} from 'typeorm';
import { Message } from './message.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    username: string;

    @Column()
    password: string;

    @Column({ default: false })
    isOnline: boolean;

    @Column({ type: 'timestamp', nullable: true })
    lastSeen: Date;

    @CreateDateColumn()
    createdAt: Date;

    @OneToMany(() => Message, (message) => message.sender)
    sentMessages: Message[];
}
