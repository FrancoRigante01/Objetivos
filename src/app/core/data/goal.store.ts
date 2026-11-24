import { Injectable, inject, signal } from '@angular/core';

import {
  Goal,
  GoalDraft,
  GoalList,
  Priority,
  ROUTINE_TARGET_DAYS,
  Reminder,
  ReminderDraft,
  RoutineState,
  Subtask
} from '../models/goal.model';
import { todayIso } from '../utils/goal-progress';
import { moveItem } from '../utils/reorder';
import { addRoutineCount, createRoutineState, restartRoutine } from '../utils/routine';
import { addSubtaskToTree, removeSubtaskFromTree, updateSubtaskInTree } from '../utils/subtask-tree';
import { APP_DATA_VERSION, GoalRepository } from './goal.repository';

export type GoalChanges = Partial<Pick<Goal, 'title' | 'description' | 'dueDate' | 'priority' | 'listId' | 'kind'>>;

const DEFAULT_LIST_NAME = 'Personal';

@Injectable({ providedIn: 'root' })
export class GoalStore {
  private readonly repository = inject(GoalRepository);

  private readonly listsState = signal<GoalList[]>([]);
  private readonly goalsState = signal<Goal[]>([]);
  private readonly remindersState = signal<Reminder[]>([]);

  readonly lists = this.listsState.asReadonly();
  readonly goals = this.goalsState.asReadonly();
  readonly reminders = this.remindersState.asReadonly();

  constructor() {
    const data = this.repository.load();
    this.listsState.set(data.lists);
    this.goalsState.set(data.goals);
    this.remindersState.set(data.reminders);

    if (this.listsState().length === 0) {
      this.listsState.set([this.createList(DEFAULT_LIST_NAME)]);
      this.persist();
    }
  }

  addList(name: string): GoalList {
    const list = this.createList(name);
    this.listsState.update(lists => [...lists, list]);
    this.persist();
    return list;
  }

  renameList(id: string, name: string): void {
    this.listsState.update(lists => lists.map(list => (list.id === id ? { ...list, name: name.trim() } : list)));
    this.persist();
  }

  removeList(id: string): void {
    this.listsState.update(lists => lists.filter(list => list.id !== id));
    this.goalsState.update(goals => goals.filter(goal => goal.listId !== id));
    this.persist();
  }

  addGoal(draft: GoalDraft): Goal {
    const goal: Goal = {
      id: crypto.randomUUID(),
      listId: draft.listId,
      title: draft.title.trim(),
      description: draft.description?.trim() ?? '',
      dueDate: draft.dueDate ?? null,
      priority: draft.priority ?? 'medium',
      completed: false,
      completedAt: null,
      myDayDate: null,
      subtasks: [],
      createdAt: new Date().toISOString(),
      kind: draft.kind ?? 'one-off',
      routine: draft.kind === 'routine' ? createRoutineState() : null
    };
    this.goalsState.update(goals => [...goals, goal]);
    this.persist();
    return goal;
  }

  moveGoal(id: string, targetId: string): void {
    this.goalsState.update(goals => moveItem(goals, id, targetId));
    this.persist();
  }

  updateGoal(id: string, changes: GoalChanges): void {
    this.updateGoalById(id, goal => {
      const kind = changes.kind ?? goal.kind;
      return {
        ...goal,
        ...changes,
        kind,
        routine: kind === 'routine' ? (goal.routine ?? createRoutineState()) : null,
        title: changes.title?.trim() ?? goal.title,
        description: changes.description?.trim() ?? goal.description
      };
    });
  }

  removeGoal(id: string): void {
    this.goalsState.update(goals => goals.filter(goal => goal.id !== id));
    this.persist();
  }

  toggleCompleted(id: string): void {
    this.updateGoalById(id, goal => {
      const completed = !goal.completed;
      return { ...goal, completed, completedAt: completed ? new Date().toISOString() : null };
    });
  }

  toggleMyDay(id: string, today: string = todayIso()): void {
    this.updateGoalById(id, goal => ({
      ...goal,
      myDayDate: goal.myDayDate === today ? null : today
    }));
  }

  addRoutineCount(id: string, now: Date = new Date()): void {
    this.updateActiveRoutine(id, (goal, routine) => {
      const nowIso = now.toISOString();
      const updated = addRoutineCount(routine, nowIso);
      const completed = updated.count >= ROUTINE_TARGET_DAYS;
      return {
        ...goal,
        routine: updated,
        completed,
        completedAt: completed ? nowIso : null
      };
    });
  }

  restartRoutine(id: string): void {
    this.updateActiveRoutine(id, (goal, routine) => ({ ...goal, routine: restartRoutine(routine) }));
  }

  setPriority(id: string, priority: Priority): void {
    this.updateGoalById(id, goal => ({ ...goal, priority }));
  }

  addSubtask(goalId: string, title: string, parentId: string | null = null): void {
    const subtask: Subtask = { id: crypto.randomUUID(), title: title.trim(), done: false, subtasks: [] };
    this.updateGoalById(goalId, goal => ({
      ...goal,
      subtasks: addSubtaskToTree(goal.subtasks, subtask, parentId)
    }));
  }

  renameSubtask(goalId: string, subtaskId: string, title: string): void {
    this.updateGoalById(goalId, goal => ({
      ...goal,
      subtasks: updateSubtaskInTree(goal.subtasks, subtaskId, subtask => ({ ...subtask, title: title.trim() }))
    }));
  }

  toggleSubtask(goalId: string, subtaskId: string): void {
    this.updateGoalById(goalId, goal => ({
      ...goal,
      subtasks: updateSubtaskInTree(goal.subtasks, subtaskId, subtask => ({ ...subtask, done: !subtask.done }))
    }));
  }

  toggleSubtaskMyDay(goalId: string, subtaskId: string, today: string = todayIso()): void {
    this.updateGoalById(goalId, goal => ({
      ...goal,
      subtasks: updateSubtaskInTree(goal.subtasks, subtaskId, subtask => ({
        ...subtask,
        myDayDate: subtask.myDayDate === today ? null : today
      }))
    }));
  }

  toggleSubtaskDoneToday(goalId: string, subtaskId: string, today: string = todayIso()): void {
    this.updateGoalById(goalId, goal => ({
      ...goal,
      subtasks: updateSubtaskInTree(goal.subtasks, subtaskId, subtask => ({
        ...subtask,
        myDayDoneDate: subtask.myDayDoneDate === today ? null : today
      }))
    }));
  }

  toggleSubtaskCollapsed(goalId: string, subtaskId: string): void {
    this.updateGoalById(goalId, goal => ({
      ...goal,
      subtasks: updateSubtaskInTree(goal.subtasks, subtaskId, subtask => ({
        ...subtask,
        collapsed: !subtask.collapsed
      }))
    }));
  }

  removeSubtask(goalId: string, subtaskId: string): void {
    this.updateGoalById(goalId, goal => ({
      ...goal,
      subtasks: removeSubtaskFromTree(goal.subtasks, subtaskId)
    }));
  }

  addReminder(draft: ReminderDraft): Reminder {
    const reminder: Reminder = {
      id: crypto.randomUUID(),
      title: draft.title.trim(),
      remindAt: draft.remindAt,
      done: false,
      createdAt: new Date().toISOString()
    };
    this.remindersState.update(reminders => [...reminders, reminder]);
    this.persist();
    return reminder;
  }

  updateReminder(id: string, draft: ReminderDraft): void {
    this.remindersState.update(reminders =>
      reminders.map(reminder =>
        reminder.id === id ? { ...reminder, title: draft.title.trim(), remindAt: draft.remindAt } : reminder
      )
    );
    this.persist();
  }

  toggleReminderDone(id: string): void {
    this.remindersState.update(reminders =>
      reminders.map(reminder => (reminder.id === id ? { ...reminder, done: !reminder.done } : reminder))
    );
    this.persist();
  }

  removeReminder(id: string): void {
    this.remindersState.update(reminders => reminders.filter(reminder => reminder.id !== id));
    this.persist();
  }

  replaceAll(data: { lists: GoalList[]; goals: Goal[]; reminders: Reminder[] }): void {
    this.listsState.set(data.lists);
    this.goalsState.set(data.goals);
    this.remindersState.set(data.reminders);
    if (data.lists.length === 0) {
      this.listsState.set([this.createList(DEFAULT_LIST_NAME)]);
    }
    this.persist();
  }

  private createList(name: string): GoalList {
    return { id: crypto.randomUUID(), name: name.trim(), createdAt: new Date().toISOString() };
  }

  private updateGoalById(id: string, update: (goal: Goal) => Goal): void {
    this.goalsState.update(goals => goals.map(goal => (goal.id === id ? update(goal) : goal)));
    this.persist();
  }

  private updateActiveRoutine(id: string, update: (goal: Goal, routine: RoutineState) => Goal): void {
    this.updateGoalById(id, goal => (goal.routine && !goal.completed ? update(goal, goal.routine) : goal));
  }

  private persist(): void {
    this.repository.save({
      version: APP_DATA_VERSION,
      lists: this.listsState(),
      goals: this.goalsState(),
      reminders: this.remindersState()
    });
  }
}
