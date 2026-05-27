import { Injectable, signal, computed } from '@angular/core';
import { Team } from '../models/team';

@Injectable({ providedIn: 'root' })
export class TeamStateService {
  private readonly _team = signal<Team | null>(null);

  readonly team = this._team.asReadonly();
  readonly teamId = computed(() => this._team()?.id ?? null);
  readonly isAuthenticated = computed(() => this._team() !== null);

  setTeam(team: Team): void {
    this._team.set(team);
    sessionStorage.setItem('selectedTeam', JSON.stringify(team));
  }

  clearTeam(): void {
    this._team.set(null);
    sessionStorage.removeItem('selectedTeam');
  }

  /** Restore team from sessionStorage (e.g. after page reload). */
  restore(): boolean {
    const raw = sessionStorage.getItem('selectedTeam');
    if (raw) {
      try {
        this._team.set(JSON.parse(raw));
        return true;
      } catch {
        sessionStorage.removeItem('selectedTeam');
      }
    }
    return false;
  }
}
