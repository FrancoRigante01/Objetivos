import { Goal, GoalKind, Priority } from '../models/goal.model';
import { getGoalProgress } from './goal-progress';
import { normalizeText } from './search';

export type GoalStatusFilter = 'all' | 'pending' | 'completed';

export type GoalSortKey = 'manual' | 'title' | 'priority' | 'dueDate' | 'progress';

export interface GoalFilters {
  status: GoalStatusFilter;
  priority: Priority | 'all';
  kind: GoalKind | 'all';
  sort: GoalSortKey;
}

export const DEFAULT_GOAL_FILTERS: GoalFilters = {
  status: 'all',
  priority: 'all',
  kind: 'all',
  sort: 'manual'
};

export const SORT_LABELS: Record<GoalSortKey, string> = {
  manual: 'Orden de creación',
  title: 'Título (A-Z)',
  priority: 'Prioridad (alta primero)',
  dueDate: 'Fecha estimada (próxima primero)',
  progress: 'Progreso (mayor primero)'
};

const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

export function hasActiveGoalFilters(filters: GoalFilters): boolean {
  return filters.status !== 'all' || filters.priority !== 'all' || filters.kind !== 'all';
}

export function applyGoalFilters(goals: Goal[], filters: GoalFilters): Goal[] {
  const filtered = goals.filter(
    goal =>
      (filters.status === 'all' || (filters.status === 'completed') === goal.completed) &&
      (filters.priority === 'all' || goal.priority === filters.priority) &&
      (filters.kind === 'all' || goal.kind === filters.kind)
  );
  return sortGoals(filtered, filters.sort);
}

export function sortGoals(goals: Goal[], sort: GoalSortKey): Goal[] {
  const sorted = [...goals];
  switch (sort) {
    case 'manual':
      return sorted;
    case 'title':
      return sorted.sort((a, b) => normalizeText(a.title).localeCompare(normalizeText(b.title)));
    case 'priority':
      return sorted.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
    case 'dueDate':
      return sorted.sort(compareDueDates);
    case 'progress':
      return sorted.sort((a, b) => getGoalProgress(b) - getGoalProgress(a));
  }
}

function compareDueDates(a: Goal, b: Goal): number {
  if (a.dueDate === b.dueDate) {
    return 0;
  }
  if (a.dueDate === null) {
    return 1;
  }
  if (b.dueDate === null) {
    return -1;
  }
  return a.dueDate.localeCompare(b.dueDate);
}
