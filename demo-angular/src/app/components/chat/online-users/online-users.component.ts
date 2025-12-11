import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../models';
import { InitialPipe } from '../../../pipes/initial.pipe';

@Component({
  selector: 'app-online-users',
  standalone: true,
  imports: [CommonModule, InitialPipe],
  templateUrl: './online-users.component.html',
  styleUrls: ['./online-users.component.scss'],
})
export class OnlineUsersComponent {
  users = input.required<User[]>();
  visible = input.required<boolean>();

  userSelected = output<User>();
  closed = output<void>();

  displayUsers = computed(() => this.users());
  isVisible = computed(() => this.visible());
}
