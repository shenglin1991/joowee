import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Person } from './entities/person.entity';
import { Daily } from './entities/daily.entity';
import { Team } from './entities/team.entity';
import { PeopleController } from './people.controller';
import { TeamController } from './team.controller';
import { PeopleService } from './services/people.service';
import { DailyService } from './services/daily.service';
import { TeamService } from './services/team.service';

@Module({
    imports: [TypeOrmModule.forFeature([Person, Daily, Team])],
    controllers: [PeopleController, TeamController],
    providers: [PeopleService, DailyService, TeamService],
})
export class PeopleModule {}
