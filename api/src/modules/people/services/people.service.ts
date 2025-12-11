import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Person } from '../entities/person.entity';
import { CreatePersonDto } from '../dto/create-person.dto';

@Injectable()
export class PeopleService {
    constructor(
        @InjectRepository(Person)
        private personRepository: Repository<Person>
    ) {}

    async findAll(): Promise<Person[]> {
        return this.personRepository.find({
            order: { createdAt: 'ASC' },
        });
    }

    async create(createPersonDto: CreatePersonDto): Promise<Person> {
        const person = this.personRepository.create(createPersonDto);
        return this.personRepository.save(person);
    }

    async remove(id: string): Promise<void> {
        await this.personRepository.delete(id);
    }
}
