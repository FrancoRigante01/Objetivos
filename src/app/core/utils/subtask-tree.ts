import { Subtask } from '../models/goal.model';

export function addSubtaskToTree(subtasks: Subtask[], child: Subtask, parentId: string | null): Subtask[] {
  if (parentId === null) {
    return [...subtasks, child];
  }
  return updateSubtaskInTree(subtasks, parentId, parent => ({ ...parent, subtasks: [...parent.subtasks, child] }));
}

export function updateSubtaskInTree(
  subtasks: Subtask[],
  id: string,
  update: (subtask: Subtask) => Subtask
): Subtask[] {
  return subtasks.map(subtask =>
    subtask.id === id
      ? update(subtask)
      : { ...subtask, subtasks: updateSubtaskInTree(subtask.subtasks, id, update) }
  );
}

export function removeSubtaskFromTree(subtasks: Subtask[], id: string): Subtask[] {
  return subtasks
    .filter(subtask => subtask.id !== id)
    .map(subtask => ({ ...subtask, subtasks: removeSubtaskFromTree(subtask.subtasks, id) }));
}
