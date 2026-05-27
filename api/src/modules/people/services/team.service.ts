import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Team } from '../entities/team.entity';
import { Person } from '../entities/person.entity';
import { Daily } from '../entities/daily.entity';

const SALT_ROUNDS = 10;

@Injectable()
export class TeamService implements OnModuleInit {
    constructor(
        @InjectRepository(Team)
        private teamRepository: Repository<Team>,
        @InjectRepository(Person)
        private personRepository: Repository<Person>,
        @InjectRepository(Daily)
        private dailyRepository: Repository<Daily>,
    ) {}

    async onModuleInit(): Promise<void> {
        await this.seed();
    }

    /** Seed the default "devTeam" if it does not exist yet. */
    private async seed(): Promise<void> {
        let team = await this.teamRepository.findOne({
            where: { name: 'devTeam' },
        });
        if (!team) {
            const hashed = await bcrypt.hash('devteam', SALT_ROUNDS);
            team = this.teamRepository.create({
                name: 'devTeam',
                password: hashed,
            });
            team = await this.teamRepository.save(team);
            console.log('[TeamService] Seeded default team "devTeam"');
        } else if (!team.password.startsWith('$2')) {
            // Migrate plain-text password to bcrypt hash
            team.password = await bcrypt.hash(team.password, SALT_ROUNDS);
            team = await this.teamRepository.save(team);
            console.log('[TeamService] Migrated devTeam password to bcrypt');
        }

        // Assign all orphan persons (without a team) to devTeam
        const orphans = await this.personRepository.find({
            where: { teamId: IsNull() },
        });
        if (orphans.length > 0) {
            for (const person of orphans) {
                person.teamId = team.id;
            }
            await this.personRepository.save(orphans);
            console.log(
                `[TeamService] Assigned ${orphans.length} existing person(s) to devTeam`,
            );
        }
    }

    async findAll(): Promise<Omit<Team, 'password'>[]> {
        const teams = await this.teamRepository.find({
            order: { createdAt: 'ASC' },
        });
        return teams.map(({ password, ...rest }) => rest);
    }

    async create(
        name: string,
        password: string,
    ): Promise<Omit<Team, 'password'>> {
        const hashed = await bcrypt.hash(password, SALT_ROUNDS);
        const team = this.teamRepository.create({ name, password: hashed });
        const saved = await this.teamRepository.save(team);
        const { password: _, ...rest } = saved;
        return rest;
    }

    async login(
        teamId: string,
        password: string,
    ): Promise<Omit<Team, 'password'> | null> {
        const team = await this.teamRepository.findOne({
            where: { id: teamId },
        });
        if (!team) return null;
        const match = await bcrypt.compare(password, team.password);
        if (!match) return null;
        const { password: _, ...rest } = team;
        return rest;
    }

    async delete(teamId: string, password: string): Promise<boolean> {
        const team = await this.teamRepository.findOne({
            where: { id: teamId },
        });
        if (!team) return false;
        const match = await bcrypt.compare(password, team.password);
        if (!match) return false;

        // Nullify daily_presenter references to this team's members
        const members = await this.personRepository.find({ where: { teamId } });
        if (members.length > 0) {
            const memberIds = members.map((m) => m.id);
            await this.dailyRepository
                .createQueryBuilder()
                .update()
                .set({ selectedPersonId: null as any })
                .where('selectedPersonId IN (:...ids)', { ids: memberIds })
                .execute();
        }

        // Also delete the team-specific daily_presenter record
        await this.dailyRepository.delete({ id: `current-${teamId}` });

        await this.teamRepository.remove(team);
        return true;
    }
}
