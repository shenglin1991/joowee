import { Component, OnDestroy, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DailyStateService } from '../../services/daily-state.service';
import { Person } from '../../models/person';

@Component({
  selector: 'app-daily',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './daily.component.html',
  styleUrl: './daily.component.scss',
})
export class DailyComponent implements OnInit, OnDestroy {
  readonly state = inject(DailyStateService);
  private readonly router = inject(Router);
  private timerHandle: any = null;

  currentPerson = this.state.currentPerson;
  remainingSeconds = this.state.remainingSeconds;
  isRunning = this.state.isRunning;
  spokenIds = this.state.spokenIds;

  // Roulette state
  selectedForTomorrow = signal<Person | null>(null);
  isSpinning = signal(false);
  wheelRotation = signal(0);

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

  constructor() {
    // Auto-start timer when currentPerson changes
    effect(() => {
      if (this.currentPerson()) {
        // Small delay to ensure state is updated
        setTimeout(() => {
          this.startTimer();
        }, 100);
      }
    });
  }

  getAvailablePeople(): Person[] {
    return this.state.people().filter((p) => !this.state.absents().has(p.id));
  }

  getColorForIndex(index: number): string {
    return this.colors[index % this.colors.length];
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  ngOnInit(): void {
    if (this.state.people().length === 0) {
      this.router.navigate(['/']);
      return;
    }
    if (!this.state.currentPerson()) {
      this.state.nextSpeaker(true);
    }
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  startTimer() {
    if (this.isRunning()) {
      return;
    }
    this.state.setRunning(true);
    this.clearTimer();
    this.timerHandle = setInterval(() => {
      const next = this.state.remainingSeconds() - 1;
      if (next <= 0) {
        this.state.setRemaining(0);
        this.moveNext();
        return;
      }
      this.state.setRemaining(next);
    }, 1000);
  }

  pauseTimer() {
    this.state.setRunning(false);
    this.clearTimer();
  }

  moveNext() {
    this.clearTimer();
    this.state.setRunning(false);
    this.state.nextSpeaker(true);
    this.state.setRemaining(this.state.timerSeconds());
  }

  clearTimer() {
    if (this.timerHandle) {
      clearInterval(this.timerHandle);
      this.timerHandle = null;
    }
  }

  everyoneSpoken(): boolean {
    const available = this.state.people().filter((p) => !this.state.absents().has(p.id));
    return available.length > 0 && available.every((p) => this.state.spokenIds().has(p.id));
  }

  spinTheWheel(): void {
    if (this.isSpinning()) return;

    const people = this.getAvailablePeople();
    if (people.length === 0) return;

    this.isSpinning.set(true);
    const spinDuration = 4; // 4 seconds spin
    const spinCount = 3; // 3 full rotations
    const selectedIndex = Math.floor(Math.random() * people.length);
    const degreesPerPerson = 360 / people.length;
    // Position l'aiguille au milieu du segment sélectionné
    const segmentCenter = selectedIndex * degreesPerPerson + degreesPerPerson / 2;
    const finalRotation = spinCount * 360 + (360 - segmentCenter);

    this.wheelRotation.set(finalRotation);

    setTimeout(() => {
      this.selectedForTomorrow.set(people[selectedIndex]);
      this.isSpinning.set(false);
    }, spinDuration * 1000);
  }
}
