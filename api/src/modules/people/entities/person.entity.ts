import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Team } from './team.entity';

@Entity('people')
export class Person {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ default: 'active' })
    status: string;

    @Column({ default: 0 })
    count: number;

    @Column({ nullable: true })
    teamId: string;

    @ManyToOne(() => Team, (team) => team.members, {
        nullable: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'teamId' })
    team: Team;

    @CreateDateColumn()
    createdAt: Date;
}
