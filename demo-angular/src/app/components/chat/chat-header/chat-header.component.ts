import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User, Nullable } from '../../../models';

@Component({
  selector: 'app-chat-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-header.component.html',
  styleUrls: ['./chat-header.component.scss'],
})
export class ChatHeaderComponent {
  currentUser = input.required<Nullable<User>>();

  newChatClicked = output<void>();
  logoutClicked = output<void>();
}
