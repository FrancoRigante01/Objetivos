import { Goal, Subtask } from '../models/goal.model';
import { isSubtaskDone } from './goal-progress';

export type SmartListKey = 'myDay' | 'important' | 'planned' | 'completed';

export interface SmartListDefinition {
  key: SmartListKey;
  title: string;
  path: string;
}

export interface MyDaySubtask {
  goal: Goal;
  subtask: Subtask;
  path: string[];
}

export const SMART_LISTS: SmartListDefinition[] = [
  { key: 'myDay', title: 'Mi día', path: '/mi-dia' },
  { key: 'important', title: 'Importantes', path: '/importantes' },
  { key: 'planned', title: 'Planificadas', path: '/planificadas' },
  { key: 'completed', title: 'Completadas', path: '/completadas' }
];

export function filterBySmartList(goals: Goal[], key: SmartListKey, today: string): Goal[] {
  switch (key) {
    case 'myDay':
      return goals.filter(goal => !goal.completed && goal.myDayDate === today);
    case 'important':
      return goals.filter(goal => !goal.completed && goal.priority === 'high');
    case 'planned':
      return goals
        .filter(goal => !goal.completed && goal.dueDate !== null)
        .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''));
    case 'completed':
      return goals.filter(goal => goal.completed);
  }
}

export function getMyDaySubtasks(goals: Goal[], today: string): MyDaySubtask[] {
  return goals
    .filter(goal => !goal.completed)
    .flatMap(goal => collectMyDay(goal, goal.subtasks, today, [goal.title]));
}

export function countSmartList(goals: Goal[], key: SmartListKey, today: string): number {
  const goalCount = filterBySmartList(goals, key, today).length;
  if (key !== 'myDay') {
    return goalCount;
  }
  const pendingSubtasks = getMyDaySubtasks(goals, today).filter(entry => entry.subtask.myDayDoneDate !== today);
  return goalCount + pendingSubtasks.length;
}

function collectMyDay(goal: Goal, subtasks: Subtask[], today: string, path: string[]): MyDaySubtask[] {
  return subtasks.flatMap(subtask => [
    ...(subtask.myDayDate === today && (subtask.myDayDoneDate === today || !isSubtaskDone(subtask))
      ? [{ goal, subtask, path }]
      : []),
    ...collectMyDay(goal, subtask.subtasks, today, [...path, subtask.title])
  ]);
}
