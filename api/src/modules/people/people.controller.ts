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
import { SetPresenterDto } from './dto/set-presenter.dto';
import { Person } from './entities/person.entity';
import { Daily } from './entities/daily.entity';
import { PeopleService } from './services/people.service';
import { DailyService } from './services/daily.service';

@Controller('people')
export class PeopleController {
    constructor(
        private readonly peopleService: PeopleService,
        private readonly dailyService: DailyService
    ) {}

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

    @Get('daily/presenter')
    async getLastPresenter(): Promise<Daily | null> {
        return this.dailyService.getLastPresenter();
    }

    @Post('daily/presenter')
    async setPresenter(@Body() dto: SetPresenterDto): Promise<Daily> {
        return this.dailyService.setPresenter(dto.personId);
    }
}
