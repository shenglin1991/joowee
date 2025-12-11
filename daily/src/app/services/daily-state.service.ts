import { Injectable, Signal, computed, signal } from '@angular/core';
import { Person } from '../models/person';

interface DailyState {
  people: Person[];
  absentIds: Set<string>;
  timerSeconds: number;
  spokenIds: Set<string>;
  currentId: string | null;
  isRunning: boolean;
  remainingSeconds: number;
}

@Injectable({ providedIn: 'root' })
export class DailyStateService {
  private readonly state = signal<DailyState>({
    people: [],
    absentIds: new Set<string>(),
    timerSeconds: 120,
    spokenIds: new Set<string>(),
    currentId: null,
    isRunning: false,
    remainingSeconds: 120,
  });

  people: Signal<Person[]> = computed(() => this.state().people);
  absents: Signal<Set<string>> = computed(() => this.state().absentIds);
  timerSeconds: Signal<number> = computed(() => this.state().timerSeconds);
  currentPerson: Signal<Person | null> = computed(() => {
    const s = this.state();
    return s.people.find((p) => p.id === s.currentId) ?? null;
  });
  remainingSeconds: Signal<number> = computed(() => this.state().remainingSeconds);
  spokenIds: Signal<Set<string>> = computed(() => this.state().spokenIds);
  isRunning: Signal<boolean> = computed(() => this.state().isRunning);

  setPeople(people: Person[]) {
    this.state.update((s) => ({
      ...s,
      people,
      absentIds: new Set([...s.absentIds].filter((id) => people.some((p) => p.id === id))),
      spokenIds: new Set([...s.spokenIds].filter((id) => people.some((p) => p.id === id))),
    }));
  }

  setTimer(seconds: number) {
    this.state.update((s) => ({ ...s, timerSeconds: seconds, remainingSeconds: seconds }));
  }

  toggleAbsent(id: string) {
    this.state.update((s) => {
      const absentIds = new Set(s.absentIds);
      absentIds.has(id) ? absentIds.delete(id) : absentIds.add(id);
      return { ...s, absentIds };
    });
  }

  resetSession() {
    this.state.update((s) => ({
      ...s,
      spokenIds: new Set(),
      currentId: null,
      isRunning: false,
      remainingSeconds: s.timerSeconds,
    }));
  }

  nextSpeaker(random = false) {
    this.state.update((s) => {
      const available = s.people.filter((p) => !s.absentIds.has(p.id));
      const remaining = available.filter((p) => !s.spokenIds.has(p.id));
      if (remaining.length === 0) {
        return { ...s, currentId: null, isRunning: false, remainingSeconds: s.timerSeconds };
      }
      const pick = random ? remaining[Math.floor(Math.random() * remaining.length)] : remaining[0];
      const spokenIds = new Set(s.spokenIds);
      spokenIds.add(pick.id);
      return {
        ...s,
        currentId: pick.id,
        spokenIds,
        isRunning: false,
        remainingSeconds: s.timerSeconds,
      };
    });
  }

  setRunning(isRunning: boolean) {
    this.state.update((s) => ({ ...s, isRunning }));
  }

  setRemaining(seconds: number) {
    this.state.update((s) => ({ ...s, remainingSeconds: seconds }));
  }
}
