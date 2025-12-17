import { IsString, IsNotEmpty } from 'class-validator';

export class SetPresenterDto {
    @IsString()
    @IsNotEmpty()
    personId: string;
}
