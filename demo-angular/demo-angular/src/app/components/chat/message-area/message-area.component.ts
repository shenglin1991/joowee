import { Component, input, output, viewChild, ElementRef, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Message, Conversation, User, Nullable } from '../../../models';
import { OtherParticipantPipe } from '../../../pipes/other-participant.pipe';
import { InitialPipe } from '../../../pipes/initial.pipe';

@Component({
  selector: 'app-message-area',
  standalone: true,
  imports: [CommonModule, FormsModule, OtherParticipantPipe, InitialPipe],
  templateUrl: './message-area.component.html',
  styleUrls: ['./message-area.component.scss'],
})
export class MessageAreaComponent {
  conversation = input.required<Nullable<Conversation>>();
  messages = input.required<Message[]>();
  currentUserId = input.required<Nullable<string>>();

  messageSent = output<string>();

  newMessageContent = '';
  private messagesContainer = viewChild<ElementRef>('messagesContainer');

  constructor() {
    effect(() => {
      const messages = this.messages();
      if (messages.length > 0) {
        setTimeout(() => this.scrollToBottom(), 100);
      }
    });
  }

  sendMessage(): void {
    const content = this.newMessageContent.trim();
    if (content) {
      this.messageSent.emit(content);
      this.newMessageContent = '';
    }
  }

  isMessageFromCurrentUser(message: Message): boolean {
    return message.senderId === this.currentUserId();
  }

  formatTime(timestamp: Date | string | number | null | undefined): string {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private scrollToBottom(): void {
    const container = this.messagesContainer();
    if (container?.nativeElement) {
      container.nativeElement.scrollTop = container.nativeElement.scrollHeight;
    }
  }
}
