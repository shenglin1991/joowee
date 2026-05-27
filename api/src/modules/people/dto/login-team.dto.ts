import { IsString, IsNotEmpty } from 'class-validator';

export class LoginTeamDto {
    @IsString()
    @IsNotEmpty()
    teamId: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}
