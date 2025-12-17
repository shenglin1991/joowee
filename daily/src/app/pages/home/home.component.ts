import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PeopleService } from '../../services/people.service';
import { DailyService, DailyPresenter } from '../../services/daily.service';
import { DailyStateService } from '../../services/daily-state.service';
import { Person } from '../../models/person';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private readonly peopleService = inject(PeopleService);
  private readonly dailyService = inject(DailyService);
  private readonly dailyState = inject(DailyStateService);
  private readonly router = inject(Router);

  people = signal<Person[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  newName = signal('');
  timerSeconds = this.dailyState.timerSeconds;
  absents = this.dailyState.absents;
  todayPresenter = signal<DailyPresenter | null>(null);

  constructor() {
    effect(() => {
      this.people.set(this.dailyState.people());
    });
  }

  ngOnInit(): void {
    this.fetchPeople();
    this.fetchTodayPresenter();
  }

  fetchPeople() {
    this.loading.set(true);
    this.peopleService.list().subscribe({
      next: (list) => {
        this.dailyState.setPeople(list);
        this.people.set(list);
        this.error.set(null);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger la liste');
        this.loading.set(false);
      },
    });
  }

  fetchTodayPresenter() {
    this.dailyService.getLastPresenter().subscribe({
      next: (presenter) => {
        this.todayPresenter.set(presenter);
      },
      error: () => {
        console.error('Erreur lors du chargement du dernier présentateur');
      },
    });
  }

  addPerson() {
    const name = this.newName().trim();
    if (!name) return;
    this.loading.set(true);
    this.peopleService.add(name).subscribe({
      next: (person) => {
        const updated = [...this.dailyState.people(), person];
        this.dailyState.setPeople(updated);
        this.people.set(updated);
        this.newName.set('');
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Ajout impossible');
        this.loading.set(false);
      },
    });
  }

  removePerson(id: string) {
    this.loading.set(true);
    this.peopleService.remove(id).subscribe({
      next: () => {
        const updated = this.dailyState.people().filter((p) => p.id !== id);
        this.dailyState.setPeople(updated);
        this.people.set(updated);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Suppression impossible');
        this.loading.set(false);
      },
    });
  }

  toggleAbsent(id: string) {
    this.dailyState.toggleAbsent(id);
  }

  updateTimer(seconds: number) {
    this.dailyState.setTimer(seconds);
  }

  startDaily() {
    this.dailyState.resetSession();
    this.dailyState.nextSpeaker(true);
    this.router.navigate(['/daily']);
  }
}
