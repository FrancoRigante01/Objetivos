import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';

import { todayIso } from '../utils/goal-progress';
import { localDateTimeIso } from '../utils/reminders';

const TICK_MS = 60_000;

@Injectable({ providedIn: 'root' })
export class ClockService {
  private readonly now = signal(new Date());

  readonly today = computed(() => todayIso(this.now()));
  readonly nowIso = computed(() => localDateTimeIso(this.now()));

  constructor() {
    const timer = setInterval(() => this.now.set(new Date()), TICK_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }
}
