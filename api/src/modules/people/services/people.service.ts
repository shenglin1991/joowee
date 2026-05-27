import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Person } from '../entities/person.entity';
import { CreatePersonDto } from '../dto/create-person.dto';

@Injectable()
export class PeopleService {
    constructor(
        @InjectRepository(Person)
        private personRepository: Repository<Person>,
    ) {}

    async findAll(teamId?: string): Promise<Person[]> {
        const where = teamId ? { teamId } : {};
        return this.personRepository.find({
            where,
            order: { createdAt: 'ASC' },
        });
    }

    async create(
        createPersonDto: CreatePersonDto,
        teamId?: string,
    ): Promise<Person> {
        const where = teamId ? { teamId } : {};
        const persons = await this.personRepository.find({ where });
        const minCount =
            persons.length > 0 ? Math.min(...persons.map((p) => p.count)) : 0;
        const person = this.personRepository.create({
            ...createPersonDto,
            teamId,
        });
        person.count = minCount;
        return this.personRepository.save(person);
    }

    async remove(id: string): Promise<void> {
        await this.personRepository.delete(id);
    }
}
