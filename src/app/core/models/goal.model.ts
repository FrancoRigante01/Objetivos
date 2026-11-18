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
}

export interface GoalDraft {
  listId: string;
  title: string;
  description?: string;
  dueDate?: string | null;
  priority?: Priority;
}
