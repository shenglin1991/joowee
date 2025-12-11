import { Pipe, PipeTransform, inject, Signal } from '@angular/core';
import { Conversation, User, Nullable } from '../models';
import { AuthResourceService } from '../services/auth.resource.service';
import { WebSocketService } from '../services/websocket.service';

@Pipe({
  name: 'otherParticipant',
  standalone: true,
  pure: false,
})
export class OtherParticipantPipe implements PipeTransform {
  private readonly authService = inject(AuthResourceService);
  private readonly webSocketService = inject(WebSocketService);

  transform(conversation: Nullable<Conversation>): Nullable<User> {
    const current = this.authService.getCurrentUser();

    if (
      !conversation ||
      !Array.isArray(conversation.participants) ||
      conversation.participants.length === 0
    ) {
      return undefined;
    }

    const other = conversation.participants.find((p) => p?.id !== current?.id);

    if (!other) {
      return undefined;
    }

    // Enrichir avec le statut en ligne
    const onlineUser = this.webSocketService.onlineUsers().find((u) => u.id === other.id);

    return {
      ...other,
      isOnline: !!onlineUser,
    };
  }
}
