import { Goal, Subtask } from '../models/goal.model';
import { getGoalProgress, isSubtaskDone, todayIso } from './goal-progress';

function buildGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 'g1',
    listId: 'l1',
    title: 'Aumentar ingresos',
    description: '',
    dueDate: null,
    priority: 'medium',
    completed: false,
    completedAt: null,
    myDayDate: null,
    subtasks: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides
  };
}

function buildSubtask(overrides: Partial<Subtask> = {}): Subtask {
  return { id: 's1', title: 'Subtarea', done: false, subtasks: [], ...overrides };
}

describe('getGoalProgress', () => {
  it('devuelve 0 cuando no hay subtareas y el objetivo no está completado', () => {
    expect(getGoalProgress(buildGoal())).toBe(0);
  });

  it('devuelve 100 cuando el objetivo está completado', () => {
    expect(getGoalProgress(buildGoal({ completed: true }))).toBe(100);
  });

  it('calcula el porcentaje según las subtareas sin hijas', () => {
    const goal = buildGoal({
      subtasks: [buildSubtask({ id: 'a', done: true }), buildSubtask({ id: 'b' }), buildSubtask({ id: 'c' })]
    });
    expect(getGoalProgress(goal)).toBe(33);
  });

  it('cuenta solo las hojas del árbol, a cualquier profundidad', () => {
    const goal = buildGoal({
      subtasks: [
        buildSubtask({
          id: 'a',
          subtasks: [
            buildSubtask({
              id: 'a1',
              subtasks: [
                buildSubtask({ id: 'a1x', done: true }),
                buildSubtask({ id: 'a1y', done: false })
              ]
            }),
            buildSubtask({ id: 'a2', done: false })
          ]
        }),
        buildSubtask({ id: 'b', done: true })
      ]
    });
    expect(getGoalProgress(goal)).toBe(50);
  });
});

describe('isSubtaskDone', () => {
  it('usa su propio estado cuando no tiene subtareas', () => {
    expect(isSubtaskDone(buildSubtask({ done: true }))).toBe(true);
    expect(isSubtaskDone(buildSubtask({ done: false }))).toBe(false);
  });

  it('está completada solo cuando todas sus subtareas lo están, a cualquier profundidad', () => {
    const pending = buildSubtask({
      subtasks: [
        buildSubtask({ id: 't1', done: true }),
        buildSubtask({ id: 't2', subtasks: [buildSubtask({ id: 't2a', done: false })] })
      ]
    });
    const finished = buildSubtask({
      subtasks: [
        buildSubtask({ id: 't1', done: true }),
        buildSubtask({ id: 't2', subtasks: [buildSubtask({ id: 't2a', done: true })] })
      ]
    });
    expect(isSubtaskDone(pending)).toBe(false);
    expect(isSubtaskDone(finished)).toBe(true);
  });
});

describe('todayIso', () => {
  it('formatea la fecha como YYYY-MM-DD con ceros a la izquierda', () => {
    expect(todayIso(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
