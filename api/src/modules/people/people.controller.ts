import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Param,
    HttpCode,
} from '@nestjs/common';
import { CreatePersonDto } from './dto/create-person.dto';
import { Person } from './entities/person.entity';
import { PeopleService } from './services/people.service';

@Controller('people')
export class PeopleController {
    constructor(private readonly peopleService: PeopleService) {}

    @Get()
    async findAll(): Promise<Person[]> {
        return this.peopleService.findAll();
    }

    @Post()
    async create(@Body() createPersonDto: CreatePersonDto): Promise<Person> {
        return this.peopleService.create(createPersonDto);
    }

    @Delete(':id')
    @HttpCode(204)
    async remove(@Param('id') id: string): Promise<void> {
        return this.peopleService.remove(id);
    }
}
