import { Goal } from '../models/goal.model';
import { countSmartList, filterBySmartList, getMyDaySubtasks } from './smart-lists';

const TODAY = '2026-03-10';

function buildGoal(overrides: Partial<Goal>): Goal {
  return {
    id: 'g',
    listId: 'l1',
    title: 'Objetivo',
    description: '',
    dueDate: null,
    priority: 'medium',
    completed: false,
    completedAt: null,
    kind: 'one-off',
    routine: null,
    myDayDate: null,
    subtasks: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides
  };
}

describe('filterBySmartList', () => {
  it('"Mi día" incluye solo objetivos pendientes añadidos hoy', () => {
    const goals = [
      buildGoal({ id: 'a', myDayDate: TODAY }),
      buildGoal({ id: 'b', myDayDate: '2026-03-09' }),
      buildGoal({ id: 'c', myDayDate: TODAY, completed: true })
    ];
    expect(filterBySmartList(goals, 'myDay', TODAY).map(goal => goal.id)).toEqual(['a']);
  });

  it('"Importantes" incluye solo prioridad alta pendiente', () => {
    const goals = [
      buildGoal({ id: 'a', priority: 'high' }),
      buildGoal({ id: 'b', priority: 'low' }),
      buildGoal({ id: 'c', priority: 'high', completed: true })
    ];
    expect(filterBySmartList(goals, 'important', TODAY).map(goal => goal.id)).toEqual(['a']);
  });

  it('"Planificadas" incluye objetivos con fecha ordenados por fecha', () => {
    const goals = [
      buildGoal({ id: 'a', dueDate: '2026-05-01' }),
      buildGoal({ id: 'b', dueDate: null }),
      buildGoal({ id: 'c', dueDate: '2026-04-01' })
    ];
    expect(filterBySmartList(goals, 'planned', TODAY).map(goal => goal.id)).toEqual(['c', 'a']);
  });

  it('"Completadas" incluye solo objetivos completados', () => {
    const goals = [buildGoal({ id: 'a' }), buildGoal({ id: 'b', completed: true })];
    expect(filterBySmartList(goals, 'completed', TODAY).map(goal => goal.id)).toEqual(['b']);
  });
});

describe('getMyDaySubtasks', () => {
  const nested = {
    id: 'p',
    title: 'Padre',
    done: false,
    subtasks: [{ id: 'h', title: 'Hija', done: false, subtasks: [], myDayDate: TODAY }],
    myDayDate: TODAY
  };

  it('incluye subtareas de hoy a cualquier profundidad, excepto las completadas', () => {
    const goals = [
      buildGoal({
        id: 'g1',
        subtasks: [
          nested,
          { id: 'd', title: 'Hecha', done: true, subtasks: [], myDayDate: TODAY },
          { id: 'o', title: 'Otro día', done: false, subtasks: [], myDayDate: '2026-03-09' }
        ]
      })
    ];

    expect(getMyDaySubtasks(goals, TODAY).map(entry => entry.subtask.id)).toEqual(['p', 'h']);
  });

  it('mantiene en Mi día una subtarea hecha hoy, sin contarla como pendiente', () => {
    const doneToday = { id: 'r', title: 'Repetida', done: false, subtasks: [], myDayDate: TODAY, myDayDoneDate: TODAY };
    const goals = [buildGoal({ id: 'g1', subtasks: [doneToday] })];

    expect(getMyDaySubtasks(goals, TODAY).map(entry => entry.subtask.id)).toEqual(['r']);
    expect(countSmartList(goals, 'myDay', TODAY)).toBe(0);
  });

  it('ignora subtareas de objetivos completados', () => {
    const goals = [buildGoal({ id: 'g1', completed: true, subtasks: [nested] })];
    expect(getMyDaySubtasks(goals, TODAY)).toEqual([]);
  });

  it('cuenta objetivos y subtareas en "Mi día"', () => {
    const goals = [buildGoal({ id: 'g1', myDayDate: TODAY, subtasks: [nested] })];
    expect(countSmartList(goals, 'myDay', TODAY)).toBe(3);
  });
});
