import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { TeamStateService } from './services/team-state.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly teamState = inject(TeamStateService);
  private readonly router = inject(Router);

  logout(): void {
    this.teamState.clearTeam();
    this.router.navigate(['/login']);
  }
}
