import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Team } from '../models/team';
import { API_BASE_URL } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class TeamService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/teams`;

  list(): Observable<Team[]> {
    return this.http.get<Team[]>(this.baseUrl);
  }

  create(name: string, password: string): Observable<Team> {
    return this.http.post<Team>(this.baseUrl, { name, password });
  }

  login(teamId: string, password: string): Observable<Team> {
    return this.http.post<Team>(`${this.baseUrl}/login`, { teamId, password });
  }

  delete(teamId: string, password: string): Observable<{ deleted: boolean }> {
    return this.http.post<{ deleted: boolean }>(`${this.baseUrl}/${teamId}/delete`, { password });
  }
}
