import { Goal, GoalList, Priority, Reminder, Subtask } from '../models/goal.model';

export const APP_DATA_VERSION = 4;

export interface AppData {
  version: number;
  lists: GoalList[];
  goals: Goal[];
  reminders: Reminder[];
}

const INVALID_BACKUP_MESSAGE = 'El archivo no es una copia válida de Objetivos.';
const PRIORITIES: Priority[] = ['low', 'medium', 'high'];

interface SubtaskV1 {
  id: string;
  title: string;
  done: boolean;
}

interface TaskV2 {
  id: string;
  title: string;
  done: boolean;
}

interface SubtaskV2 extends SubtaskV1 {
  tasks: TaskV2[];
}

interface AppDataV1 {
  version: 1;
  lists: GoalList[];
  goals: (Omit<Goal, 'subtasks'> & { subtasks: SubtaskV1[] })[];
}

interface AppDataV2 {
  version: 2;
  lists: GoalList[];
  goals: (Omit<Goal, 'subtasks'> & { subtasks: SubtaskV2[] })[];
}

interface AppDataV3 {
  version: 3;
  lists: GoalList[];
  goals: Goal[];
}

export function serializeAppData(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

export function parseAppData(text: string): AppData {
  try {
    const parsed: unknown = JSON.parse(text);
    if (!isRecord(parsed)) {
      throw new Error(INVALID_BACKUP_MESSAGE);
    }
    return validateAppData(upgradeToCurrent(parsed));
  } catch {
    throw new Error(INVALID_BACKUP_MESSAGE);
  }
}

function upgradeToCurrent(raw: Record<string, unknown>): unknown {
  switch (raw['version']) {
    case 1:
      return migrateV3ToV4(migrateV2ToV3(migrateV1ToV2(raw as unknown as AppDataV1)));
    case 2:
      return migrateV3ToV4(migrateV2ToV3(raw as unknown as AppDataV2));
    case 3:
      return migrateV3ToV4(raw as unknown as AppDataV3);
    default:
      return raw;
  }
}

function migrateV1ToV2(data: AppDataV1): AppDataV2 {
  return {
    version: 2,
    lists: data.lists,
    goals: data.goals.map(goal => ({
      ...goal,
      subtasks: goal.subtasks.map(subtask => ({ ...subtask, tasks: [] }))
    }))
  };
}

function migrateV2ToV3(data: AppDataV2): AppDataV3 {
  return {
    version: 3,
    lists: data.lists,
    goals: data.goals.map(goal => ({
      ...goal,
      subtasks: goal.subtasks.map(subtaskV2ToV3)
    }))
  };
}

function migrateV3ToV4(data: AppDataV3): AppData {
  return { version: APP_DATA_VERSION, lists: data.lists, goals: data.goals, reminders: [] };
}

function subtaskV2ToV3(subtask: SubtaskV2): Subtask {
  return {
    id: subtask.id,
    title: subtask.title,
    done: subtask.done,
    subtasks: subtask.tasks.map(task => ({ id: task.id, title: task.title, done: task.done, subtasks: [] }))
  };
}

function validateAppData(value: unknown): AppData {
  if (!isRecord(value) || value['version'] !== APP_DATA_VERSION) {
    throw new Error(INVALID_BACKUP_MESSAGE);
  }
  const lists = value['lists'];
  const goals = value['goals'];
  const reminders = value['reminders'];
  if (
    !Array.isArray(lists) ||
    !lists.every(isGoalList) ||
    !Array.isArray(goals) ||
    !goals.every(isGoal) ||
    !Array.isArray(reminders) ||
    !reminders.every(isReminder)
  ) {
    throw new Error(INVALID_BACKUP_MESSAGE);
  }
  return { version: APP_DATA_VERSION, lists, goals, reminders };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isGoalList(value: unknown): value is GoalList {
  return isRecord(value) && isString(value['id']) && isString(value['name']) && isString(value['createdAt']);
}

function isGoal(value: unknown): value is Goal {
  return (
    isRecord(value) &&
    isString(value['id']) &&
    isString(value['listId']) &&
    isString(value['title']) &&
    isString(value['description']) &&
    isNullableString(value['dueDate']) &&
    PRIORITIES.includes(value['priority'] as Priority) &&
    typeof value['completed'] === 'boolean' &&
    isNullableString(value['completedAt']) &&
    isNullableString(value['myDayDate']) &&
    isString(value['createdAt']) &&
    Array.isArray(value['subtasks']) &&
    value['subtasks'].every(isSubtask)
  );
}

function isReminder(value: unknown): value is Reminder {
  return (
    isRecord(value) &&
    isString(value['id']) &&
    isString(value['title']) &&
    isString(value['remindAt']) &&
    typeof value['done'] === 'boolean' &&
    isString(value['createdAt'])
  );
}

function isSubtask(value: unknown): value is Subtask {
  return (
    isRecord(value) &&
    isString(value['id']) &&
    isString(value['title']) &&
    typeof value['done'] === 'boolean' &&
    (value['collapsed'] === undefined || typeof value['collapsed'] === 'boolean') &&
    (value['myDayDate'] === undefined || isNullableString(value['myDayDate'])) &&
    (value['myDayDoneDate'] === undefined || isNullableString(value['myDayDoneDate'])) &&
    Array.isArray(value['subtasks']) &&
    value['subtasks'].every(isSubtask)
  );
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}
