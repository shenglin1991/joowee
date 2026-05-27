import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Daily } from '../entities/daily.entity';
import { Person } from '../entities/person.entity';

@Injectable()
export class DailyService {
    constructor(
        @InjectRepository(Daily)
        private dailyRepository: Repository<Daily>,
        @InjectRepository(Person)
        private personRepository: Repository<Person>,
    ) {}

    async getLastPresenter(teamId?: string): Promise<Daily | null> {
        const id = teamId ? `current-${teamId}` : 'current';
        return this.dailyRepository.findOne({
            where: { id },
            relations: ['selectedPerson'],
        });
    }

    async setPresenter(personId: string, teamId?: string): Promise<Daily> {
        // Check if person exists
        const person = await this.personRepository.findOne({
            where: { id: personId },
        });

        if (!person) {
            throw new Error('Person not found');
        }

        const id = teamId ? `current-${teamId}` : 'current';

        // Find or create the current presenter record
        let daily = await this.dailyRepository.findOne({
            where: { id },
        });

        if (!daily) {
            daily = this.dailyRepository.create({
                id,
                selectedPersonId: personId,
            });
        } else {
            daily.selectedPersonId = personId;
        }
        person.count++;
        await this.personRepository.save(person);

        return this.dailyRepository.save(daily);
    }
}
