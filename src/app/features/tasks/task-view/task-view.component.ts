import { Component, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';

import { GoalStore } from '../../../core/data/goal.store';
import { Goal, GoalDraft, PRIORITY_LABELS, Priority, Subtask } from '../../../core/models/goal.model';
import { getGoalProgress, todayIso } from '../../../core/utils/goal-progress';
import {
  filterBySmartList,
  getMyDaySubtasks,
  MyDaySubtask,
  SMART_LISTS,
  SmartListKey
} from '../../../core/utils/smart-lists';
import { GoalFormComponent } from '../../goals/goal-form/goal-form.component';
import { GoalSubtasksComponent } from '../../goals/goal-subtasks/goal-subtasks.component';
import { ListNameFormComponent } from '../../lists/list-name-form/list-name-form.component';

@Component({
  selector: 'app-task-view',
  imports: [GoalFormComponent, GoalSubtasksComponent, ListNameFormComponent],
  templateUrl: './task-view.component.html'
})
export class TaskViewComponent {
  protected readonly store = inject(GoalStore);
  private readonly router = inject(Router);

  readonly smartList = input<SmartListKey>();
  readonly listId = input<string>();

  protected readonly today = todayIso();
  protected readonly priorityLabels = PRIORITY_LABELS;
  protected readonly priorityClasses: Record<Priority, string> = {
    low: 'bg-slate-100 text-slate-600',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-rose-100 text-rose-700'
  };

  protected readonly creating = signal(false);
  protected readonly editingGoalId = signal<string | null>(null);
  protected readonly renaming = signal(false);

  protected readonly currentList = computed(() => this.store.lists().find(list => list.id === this.listId()));
  protected readonly defaultListId = computed(() => this.currentList()?.id ?? this.store.lists()[0]?.id ?? '');

  protected readonly title = computed(() => {
    const key = this.smartList();
    if (key) {
      return SMART_LISTS.find(item => item.key === key)?.title ?? '';
    }
    return this.currentList()?.name ?? 'Lista no encontrada';
  });

  protected readonly goals = computed<Goal[]>(() => {
    const key = this.smartList();
    if (key) {
      return filterBySmartList(this.store.goals(), key, this.today);
    }
    return this.store.goals().filter(goal => goal.listId === this.listId());
  });

  protected readonly mySubtasks = computed<MyDaySubtask[]>(() =>
    this.smartList() === 'myDay' ? getMyDaySubtasks(this.store.goals(), this.today) : []
  );

  protected readonly pendingCount = computed(
    () =>
      this.goals().filter(goal => !goal.completed).length +
      this.mySubtasks().filter(entry => !this.isDoneToday(entry.subtask)).length
  );

  protected progress(goal: Goal): number {
    return getGoalProgress(goal);
  }

  protected isDoneToday(subtask: Subtask): boolean {
    return subtask.myDayDoneDate === this.today;
  }

  protected isInMyDay(goal: Goal): boolean {
    return goal.myDayDate === this.today;
  }

  protected isOverdue(goal: Goal): boolean {
    return !goal.completed && goal.dueDate !== null && goal.dueDate < this.today;
  }

  protected formatDate(isoDate: string): string {
    const [year, month, day] = isoDate.split('-').map(Number);
    return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric' }).format(
      new Date(year, month - 1, day)
    );
  }

  protected startCreate(): void {
    this.editingGoalId.set(null);
    this.creating.set(true);
  }

  protected startEdit(goal: Goal): void {
    this.creating.set(false);
    this.editingGoalId.set(goal.id);
  }

  protected cancelForm(): void {
    this.creating.set(false);
    this.editingGoalId.set(null);
  }

  protected createGoal(draft: GoalDraft): void {
    this.store.addGoal(draft);
    this.creating.set(false);
  }

  protected updateGoal(goal: Goal, draft: GoalDraft): void {
    this.store.updateGoal(goal.id, draft);
    this.editingGoalId.set(null);
  }

  protected deleteGoal(goal: Goal): void {
    if (window.confirm(`¿Eliminar "${goal.title}"?`)) {
      this.store.removeGoal(goal.id);
    }
  }

  protected renameList(name: string): void {
    const list = this.currentList();
    if (list) {
      this.store.renameList(list.id, name);
    }
    this.renaming.set(false);
  }

  protected deleteList(): void {
    const list = this.currentList();
    if (list && window.confirm(`¿Eliminar la lista "${list.name}" y todos sus objetivos?`)) {
      this.store.removeList(list.id);
      this.router.navigate(['/mi-dia']);
    }
  }
}
