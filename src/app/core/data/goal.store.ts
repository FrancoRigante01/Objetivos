import { Injectable, inject, signal } from '@angular/core';

import { Goal, GoalDraft, GoalList, Priority, Subtask } from '../models/goal.model';
import { todayIso } from '../utils/goal-progress';
import { addSubtaskToTree, removeSubtaskFromTree, updateSubtaskInTree } from '../utils/subtask-tree';
import { APP_DATA_VERSION, GoalRepository } from './goal.repository';

export type GoalChanges = Partial<Pick<Goal, 'title' | 'description' | 'dueDate' | 'priority' | 'listId'>>;

const DEFAULT_LIST_NAME = 'Personal';

@Injectable({ providedIn: 'root' })
export class GoalStore {
  private readonly repository = inject(GoalRepository);

  private readonly listsState = signal<GoalList[]>([]);
  private readonly goalsState = signal<Goal[]>([]);

  readonly lists = this.listsState.asReadonly();
  readonly goals = this.goalsState.asReadonly();

  constructor() {
    const data = this.repository.load();
    this.listsState.set(data.lists);
    this.goalsState.set(data.goals);

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
      createdAt: new Date().toISOString()
    };
    this.goalsState.update(goals => [...goals, goal]);
    this.persist();
    return goal;
  }

  updateGoal(id: string, changes: GoalChanges): void {
    this.updateGoalById(id, goal => ({
      ...goal,
      ...changes,
      title: changes.title?.trim() ?? goal.title,
      description: changes.description?.trim() ?? goal.description
    }));
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

  replaceAll(data: { lists: GoalList[]; goals: Goal[] }): void {
    this.listsState.set(data.lists);
    this.goalsState.set(data.goals);
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

  private persist(): void {
    this.repository.save({
      version: APP_DATA_VERSION,
      lists: this.listsState(),
      goals: this.goalsState()
    });
  }
}
