import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

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

  getLastPresenter(): Observable<DailyPresenter | null> {
    return this.http.get<DailyPresenter | null>(`${API_BASE_URL}/people/daily/presenter`);
  }

  setPresenter(personId: string): Observable<DailyPresenter> {
    return this.http.post<DailyPresenter>(`${API_BASE_URL}/people/daily/presenter`, { personId });
  }
}
