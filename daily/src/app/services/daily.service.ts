import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { TeamStateService } from './team-state.service';

export interface DailyPresenter {
  id: string;
  selectedPersonId: string | null;
  selectedPerson: {
    id: string;
    name: string;
    status: string;
  } | null;
}

@Injectable({
  providedIn: 'root',
})
export class DailyService {
  private http = inject(HttpClient);
  private teamState = inject(TeamStateService);

  private get teamQuery(): string {
    const teamId = this.teamState.teamId();
    return teamId ? `?teamId=${teamId}` : '';
  }

  getLastPresenter(): Observable<DailyPresenter | null> {
    return this.http.get<DailyPresenter | null>(
      `${API_BASE_URL}/people/daily/presenter${this.teamQuery}`,
    );
  }

  setPresenter(personId: string): Observable<DailyPresenter> {
    return this.http.post<DailyPresenter>(
      `${API_BASE_URL}/people/daily/presenter${this.teamQuery}`,
      { personId },
    );
  }
}
