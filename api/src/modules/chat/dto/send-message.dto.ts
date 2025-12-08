import { IsString, IsNotEmpty, IsUUID, IsDateString } from 'class-validator';

export class SendMessageDto {
    @IsUUID()
    @IsNotEmpty()
    conversationId: string;

    @IsString()
    @IsNotEmpty()
    content: string;

    @IsDateString()
    @IsNotEmpty()
    timestamp: Date;
}
