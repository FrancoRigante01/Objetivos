import { Component, inject, input } from '@angular/core';

import { GoalStore } from '../../../core/data/goal.store';
import { Goal, ROUTINE_TARGET_DAYS } from '../../../core/models/goal.model';
import { formatRoutineLastCounted } from '../../../core/utils/routine';

@Component({
  selector: 'app-goal-routine',
  templateUrl: './goal-routine.component.html'
})
export class GoalRoutineComponent {
  protected readonly store = inject(GoalStore);

  readonly goal = input.required<Goal>();

  protected readonly target = ROUTINE_TARGET_DAYS;

  protected progress(): number {
    return Math.min(100, Math.round(((this.goal().routine?.count ?? 0) / ROUTINE_TARGET_DAYS) * 100));
  }

  protected lastCounted(): string {
    const lastCountedAt = this.goal().routine?.lastCountedAt;
    return lastCountedAt ? formatRoutineLastCounted(lastCountedAt) : 'nunca';
  }

  protected restart(): void {
    if (window.confirm(`¿Reiniciar la racha de "${this.goal().title}"?`)) {
      this.store.restartRoutine(this.goal().id);
    }
  }
}
