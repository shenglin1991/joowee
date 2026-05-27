import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Person } from '../models/person';
import { API_BASE_URL } from '../config/api.config';
import { TeamStateService } from './team-state.service';

@Injectable({ providedIn: 'root' })
export class PeopleService {
  private readonly http = inject(HttpClient);
  private readonly teamState = inject(TeamStateService);
  private readonly baseUrl = `${API_BASE_URL}/people`;

  private get teamQuery(): string {
    const teamId = this.teamState.teamId();
    return teamId ? `?teamId=${teamId}` : '';
  }

  list(): Observable<Person[]> {
    return this.http.get<Person[]>(`${this.baseUrl}${this.teamQuery}`);
  }

  add(name: string): Observable<Person> {
    return this.http.post<Person>(`${this.baseUrl}${this.teamQuery}`, { name });
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
