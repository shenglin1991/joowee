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
        private personRepository: Repository<Person>
    ) {}

    async getLastPresenter(): Promise<Daily | null> {
        return this.dailyRepository.findOne({
            where: { id: 'current' },
            relations: ['selectedPerson'],
        });
    }

    async setPresenter(personId: string): Promise<Daily> {
        // Check if person exists
        const person = await this.personRepository.findOne({
            where: { id: personId },
        });

        if (!person) {
            throw new Error('Person not found');
        }

        // Find or create the current presenter record
        let daily = await this.dailyRepository.findOne({
            where: { id: 'current' },
        });

        if (!daily) {
            daily = this.dailyRepository.create({
                id: 'current',
                selectedPersonId: personId,
            });
        } else {
            daily.selectedPersonId = personId;
        }

        return this.dailyRepository.save(daily);
    }
}
