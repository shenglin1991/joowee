import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Person } from './entities/person.entity';
import { Daily } from './entities/daily.entity';
import { PeopleController } from './people.controller';
import { PeopleService } from './services/people.service';
import { DailyService } from './services/daily.service';

@Module({
    imports: [TypeOrmModule.forFeature([Person, Daily])],
    controllers: [PeopleController],
    providers: [PeopleService, DailyService],
})
export class PeopleModule {}
