import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Conversation, Nullable } from '../../../models';
import { OtherParticipantPipe } from '../../../pipes/other-participant.pipe';
import { InitialPipe } from '../../../pipes/initial.pipe';

@Component({
  selector: 'app-conversation-list',
  standalone: true,
  imports: [CommonModule, OtherParticipantPipe, InitialPipe],
  templateUrl: './conversation-list.component.html',
  styleUrls: ['./conversation-list.component.scss'],
})
export class ConversationListComponent {
  conversations = input.required<Conversation[]>();
  selectedConversationId = input<Nullable<string>>(null);

  conversationSelected = output<Conversation>();

  formatTime(timestamp: Date | string | number | null | undefined): string {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
