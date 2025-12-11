import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Person } from '../models/person';
import { API_BASE_URL } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class PeopleService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/people`;

  list(): Observable<Person[]> {
    return this.http.get<Person[]>(this.baseUrl);
  }

  add(name: string): Observable<Person> {
    return this.http.post<Person>(this.baseUrl, { name });
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
