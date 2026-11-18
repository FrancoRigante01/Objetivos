import { Goal, Subtask } from '../models/goal.model';

export function todayIso(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isSubtaskDone(subtask: Subtask): boolean {
  return subtask.subtasks.length > 0 ? subtask.subtasks.every(isSubtaskDone) : subtask.done;
}

export function getGoalProgress(goal: Goal): number {
  if (goal.completed) {
    return 100;
  }
  const leaves = collectLeaves(goal.subtasks);
  if (leaves.length === 0) {
    return 0;
  }
  const done = leaves.filter(leaf => leaf.done).length;
  return Math.round((done / leaves.length) * 100);
}

function collectLeaves(subtasks: Subtask[]): Subtask[] {
  return subtasks.flatMap(subtask => (subtask.subtasks.length > 0 ? collectLeaves(subtask.subtasks) : [subtask]));
}
