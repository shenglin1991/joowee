import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PeopleService } from '../../services/people.service';
import { DailyService } from '../../services/daily.service';
import { Person } from '../../models/person';

@Component({
  selector: 'app-presenter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './presenter.component.html',
  styleUrl: './presenter.component.scss',
})
export class PresenterComponent implements OnInit {
  private readonly peopleService = inject(PeopleService);
  private readonly dailyService = inject(DailyService);
  private readonly router = inject(Router);

  people = signal<Person[]>([]);
  selectedIds = signal<Set<string>>(new Set());
  loading = signal(false);
  error = signal<string | null>(null);

  // Roulette state
  selectedForTomorrow = signal<Person | null>(null);
  isSpinning = signal(false);
  wheelRotation = signal(0);

  availablePeople = computed(() =>
    this.people().filter((p) => this.selectedIds().has(p.id))
  );

  private colors = [
    '#60a5fa', // blue
    '#a78bfa', // purple
    '#ec4899', // pink
    '#f59e0b', // amber
    '#10b981', // emerald
    '#06b6d4', // cyan
    '#8b5cf6', // violet
    '#f43f5e', // rose
    '#14b8a6', // teal
    '#6366f1', // indigo
  ];

  ngOnInit(): void {
    this.fetchPeople();
  }

  fetchPeople() {
    this.loading.set(true);
    this.peopleService.list().subscribe({
      next: (list) => {
        this.people.set(list);
        this.selectedIds.set(new Set(list.map((p) => p.id)));
        this.error.set(null);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger la liste');
        this.loading.set(false);
      },
    });
  }

  toggleSelected(id: string) {
    this.selectedIds.update((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  getColorForIndex(index: number): string {
    return this.colors[index % this.colors.length];
  }

  goHome() {
    this.router.navigate(['/']);
  }

  spinTheWheel(): void {
    if (this.isSpinning()) return;

    const people = this.availablePeople();
    if (people.length === 0) return;

    this.isSpinning.set(true);
    const spinDuration = 4; // 4 seconds spin
    const spinCount = 3; // 3 full rotations
    const selectedPerson = this.pickBiasedByCount(people);
    const selectedIndex = people.map((p) => p.id).indexOf(selectedPerson?.id ?? '');
    const degreesPerPerson = 360 / people.length;
    const segmentCenter = selectedIndex * degreesPerPerson + degreesPerPerson / 2;
    const finalRotation = spinCount * 360 + (360 - segmentCenter);

    this.wheelRotation.set(finalRotation);

    setTimeout(() => {
      const selected = people[selectedIndex];
      this.selectedForTomorrow.set(selected);
      this.isSpinning.set(false);

      this.dailyService.setPresenter(selected.id).subscribe({
        next: () => {
          console.log('Présentateur sauvegardé:', selected.name);
        },
        error: (err) => {
          console.error('Erreur lors de la sauvegarde:', err);
        },
      });
    }, spinDuration * 1000);
  }

  private pickBiasedByCount(people: Person[]): Person | undefined {
    if (people.length === 0) return undefined;

    const maxCount = Math.max(...people.map((p) => p.count));

    // Poids : plus le count est bas, plus le poids est grand
    const weights = people.map((p) => maxCount - p.count + 1);

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let r = Math.random() * totalWeight;

    for (let i = 0; i < people.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        return people[i];
      }
    }

    return people[people.length - 1];
  }
}

