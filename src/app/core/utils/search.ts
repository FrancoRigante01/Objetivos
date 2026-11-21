import { Goal, GoalList, Subtask } from '../models/goal.model';

const MAX_RESULTS = 20;

export type SearchResult =
  | { type: 'goal'; goal: Goal; listName: string }
  | { type: 'subtask'; goal: Goal; listName: string; subtask: Subtask; path: string[] };

export function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

export function searchGoals(goals: Goal[], lists: GoalList[], query: string): SearchResult[] {
  const needle = normalizeText(query);
  if (needle === '') {
    return [];
  }

  const listName = (listId: string) => lists.find(list => list.id === listId)?.name ?? '';
  const matches = (text: string) => normalizeText(text).includes(needle);

  const goalsByTitle = goals.filter(goal => matches(goal.title));
  const goalsByDescription = goals.filter(goal => !matches(goal.title) && matches(goal.description));
  const subtaskResults = goals.flatMap(goal =>
    collectMatchingSubtasks(goal.subtasks, matches, []).map(({ subtask, path }) => ({
      type: 'subtask' as const,
      goal,
      listName: listName(goal.listId),
      subtask,
      path
    }))
  );

  return [
    ...goalsByTitle.map(goal => ({ type: 'goal' as const, goal, listName: listName(goal.listId) })),
    ...goalsByDescription.map(goal => ({ type: 'goal' as const, goal, listName: listName(goal.listId) })),
    ...subtaskResults
  ].slice(0, MAX_RESULTS);
}

function collectMatchingSubtasks(
  subtasks: Subtask[],
  matches: (text: string) => boolean,
  path: string[]
): { subtask: Subtask; path: string[] }[] {
  return subtasks.flatMap(subtask => [
    ...(matches(subtask.title) ? [{ subtask, path }] : []),
    ...collectMatchingSubtasks(subtask.subtasks, matches, [...path, subtask.title])
  ]);
}
