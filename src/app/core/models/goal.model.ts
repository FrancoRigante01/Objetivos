export type Priority = 'low' | 'medium' | 'high';

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta'
};

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
  subtasks: Subtask[];
  collapsed?: boolean;
  myDayDate?: string | null;
  myDayDoneDate?: string | null;
}

export interface GoalList {
  id: string;
  name: string;
  createdAt: string;
}

export type GoalKind = 'one-off' | 'routine';

export const ROUTINE_TARGET_DAYS = 90;

export interface RoutineState {
  count: number;
  bestCount: number;
  lastCountedAt: string | null;
}

export interface Goal {
  id: string;
  listId: string;
  title: string;
  description: string;
  dueDate: string | null;
  priority: Priority;
  completed: boolean;
  completedAt: string | null;
  myDayDate: string | null;
  subtasks: Subtask[];
  createdAt: string;
  kind: GoalKind;
  routine: RoutineState | null;
}

export interface GoalDraft {
  listId: string;
  title: string;
  description?: string;
  dueDate?: string | null;
  priority?: Priority;
  kind?: GoalKind;
}

export interface Reminder {
  id: string;
  title: string;
  remindAt: string;
  done: boolean;
  createdAt: string;
}

export interface ReminderDraft {
  title: string;
  remindAt: string;
}
