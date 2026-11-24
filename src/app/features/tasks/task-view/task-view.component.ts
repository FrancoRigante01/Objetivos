import { Component, Injector, afterNextRender, computed, effect, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';

import { GoalStore } from '../../../core/data/goal.store';
import { Goal, GoalDraft, GoalKind, KIND_LABELS, PRIORITY_LABELS, Priority, Subtask } from '../../../core/models/goal.model';
import {
  applyGoalFilters,
  DEFAULT_GOAL_FILTERS,
  GoalFilters,
  GoalSortKey,
  GoalStatusFilter,
  hasActiveGoalFilters,
  SORT_LABELS
} from '../../../core/utils/goal-filters';
import { getGoalProgress, todayIso } from '../../../core/utils/goal-progress';
import {
  filterBySmartList,
  getMyDaySubtasks,
  MyDaySubtask,
  SMART_LISTS,
  SmartListKey
} from '../../../core/utils/smart-lists';
import { GoalFormComponent } from '../../goals/goal-form/goal-form.component';
import { GoalRoutineComponent } from '../../goals/goal-routine/goal-routine.component';
import { GoalSubtasksComponent } from '../../goals/goal-subtasks/goal-subtasks.component';
import { ListNameFormComponent } from '../../lists/list-name-form/list-name-form.component';

@Component({
  selector: 'app-task-view',
  imports: [GoalFormComponent, GoalSubtasksComponent, GoalRoutineComponent, ListNameFormComponent],
  templateUrl: './task-view.component.html'
})
export class TaskViewComponent {
  protected readonly store = inject(GoalStore);
  private readonly router = inject(Router);

  readonly smartList = input<SmartListKey>();
  readonly listId = input<string>();
  readonly highlightedGoalId = input<string>('', { alias: 'resaltar' });

  private readonly injector = inject(Injector);

  protected readonly today = todayIso();
  protected readonly priorityLabels = PRIORITY_LABELS;
  protected readonly priorityClasses: Record<Priority, string> = {
    low: 'bg-slate-100 text-slate-600',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-rose-100 text-rose-700'
  };

  protected readonly statusOptions: { value: GoalStatusFilter; label: string }[] = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'pending', label: 'Pendientes' },
    { value: 'completed', label: 'Completados' }
  ];
  protected readonly priorityOptions: { value: Priority | 'all'; label: string }[] = [
    { value: 'all', label: 'Todas las prioridades' },
    { value: 'high', label: PRIORITY_LABELS.high },
    { value: 'medium', label: PRIORITY_LABELS.medium },
    { value: 'low', label: PRIORITY_LABELS.low }
  ];
  protected readonly kindOptions: { value: GoalKind | 'all'; label: string }[] = [
    { value: 'all', label: 'Todos los tipos' },
    { value: 'one-off', label: KIND_LABELS['one-off'] },
    { value: 'routine', label: KIND_LABELS.routine }
  ];
  protected readonly sortOptions: { value: GoalSortKey; label: string }[] = (
    Object.keys(SORT_LABELS) as GoalSortKey[]
  ).map(value => ({ value, label: SORT_LABELS[value] }));

  protected readonly filters = signal<GoalFilters>(DEFAULT_GOAL_FILTERS);
  protected readonly filtersActive = computed(() => hasActiveGoalFilters(this.filters()));

  protected readonly creating = signal(false);
  protected readonly editingGoalId = signal<string | null>(null);
  protected readonly renaming = signal(false);

  constructor() {
    effect(() => {
      const goalId = this.highlightedGoalId();
      if (goalId) {
        afterNextRender(() => document.getElementById(`goal-${goalId}`)?.scrollIntoView({ block: 'center' }), {
          injector: this.injector
        });
      }
    });
  }

  protected readonly currentList = computed(() => this.store.lists().find(list => list.id === this.listId()));
  protected readonly defaultListId = computed(() => this.currentList()?.id ?? this.store.lists()[0]?.id ?? '');

  protected readonly title = computed(() => {
    const key = this.smartList();
    if (key) {
      return SMART_LISTS.find(item => item.key === key)?.title ?? '';
    }
    return this.currentList()?.name ?? 'Lista no encontrada';
  });

  protected readonly viewGoals = computed<Goal[]>(() => {
    const key = this.smartList();
    if (key) {
      return filterBySmartList(this.store.goals(), key, this.today);
    }
    return this.store.goals().filter(goal => goal.listId === this.listId());
  });

  protected readonly goals = computed<Goal[]>(() => applyGoalFilters(this.viewGoals(), this.filters()));

  protected readonly mySubtasks = computed<MyDaySubtask[]>(() =>
    this.smartList() === 'myDay' ? getMyDaySubtasks(this.store.goals(), this.today) : []
  );

  protected readonly pendingCount = computed(
    () =>
      this.viewGoals().filter(goal => !goal.completed).length +
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

  protected setFilter<K extends keyof GoalFilters>(key: K, value: GoalFilters[K]): void {
    this.filters.update(filters => ({ ...filters, [key]: value }));
  }

  protected clearFilters(): void {
    this.filters.update(filters => ({ ...DEFAULT_GOAL_FILTERS, sort: filters.sort }));
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
