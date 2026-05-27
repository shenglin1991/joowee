import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Param,
    HttpCode,
    UnauthorizedException,
    ConflictException,
} from '@nestjs/common';
import { TeamService } from './services/team.service';
import { LoginTeamDto } from './dto/login-team.dto';
import { CreateTeamDto } from './dto/create-team.dto';

@Controller('teams')
export class TeamController {
    constructor(private readonly teamService: TeamService) {}

    @Get()
    async findAll() {
        return this.teamService.findAll();
    }

    @Post()
    async create(@Body() dto: CreateTeamDto) {
        try {
            return await this.teamService.create(dto.name, dto.password);
        } catch (e: any) {
            if (e?.code === 'ER_DUP_ENTRY' || e?.message?.includes('UNIQUE')) {
                throw new ConflictException(
                    'Une équipe avec ce nom existe déjà',
                );
            }
            throw e;
        }
    }

    @Post('login')
    @HttpCode(200)
    async login(@Body() dto: LoginTeamDto) {
        const team = await this.teamService.login(dto.teamId, dto.password);
        if (!team) {
            throw new UnauthorizedException('Mot de passe incorrect');
        }
        return team;
    }

    @Post(':id/delete')
    @HttpCode(200)
    async remove(@Param('id') id: string, @Body() body: { password: string }) {
        const deleted = await this.teamService.delete(id, body.password);
        if (!deleted) {
            throw new UnauthorizedException('Mot de passe incorrect');
        }
        return { deleted: true };
    }
}
