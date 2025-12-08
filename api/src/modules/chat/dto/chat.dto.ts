import { IsUUID } from 'class-validator';

export class JoinConversationDto {
    @IsUUID()
    conversationId: string;
}

export class LeaveConversationDto {
    @IsUUID()
    conversationId: string;
}

export class StartConversationDto {
    @IsUUID()
    userId: string;
}

export class MarkAsReadDto {
    @IsUUID()
    messageId: string;
}
