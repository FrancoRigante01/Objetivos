import { Goal } from '../models/goal.model';
import { applyGoalFilters, DEFAULT_GOAL_FILTERS, GoalFilters, hasActiveGoalFilters } from './goal-filters';

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

function withFilters(overrides: Partial<GoalFilters>): GoalFilters {
  return { ...DEFAULT_GOAL_FILTERS, ...overrides };
}

const goals: Goal[] = [
  buildGoal({ id: 'a', title: 'Leer', priority: 'low', dueDate: '2026-05-10' }),
  buildGoal({ id: 'b', title: 'Ahorrar', priority: 'high', completed: true, dueDate: null }),
  buildGoal({
    id: 'c',
    title: 'Meditar',
    priority: 'high',
    kind: 'routine',
    routine: { count: 45, bestCount: 45, lastCountedAt: null },
    dueDate: '2026-02-01'
  }),
  buildGoal({ id: 'd', title: 'Árbol', priority: 'medium', dueDate: null })
];

describe('applyGoalFilters', () => {
  it('sin filtros devuelve todos los objetivos en orden de creación', () => {
    expect(applyGoalFilters(goals, DEFAULT_GOAL_FILTERS).map(goal => goal.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('filtra por estado pendiente o completado', () => {
    expect(applyGoalFilters(goals, withFilters({ status: 'pending' })).map(goal => goal.id)).toEqual(['a', 'c', 'd']);
    expect(applyGoalFilters(goals, withFilters({ status: 'completed' })).map(goal => goal.id)).toEqual(['b']);
  });

  it('filtra por prioridad', () => {
    expect(applyGoalFilters(goals, withFilters({ priority: 'high' })).map(goal => goal.id)).toEqual(['b', 'c']);
  });

  it('filtra por tipo', () => {
    expect(applyGoalFilters(goals, withFilters({ kind: 'routine' })).map(goal => goal.id)).toEqual(['c']);
  });

  it('combina los filtros con AND', () => {
    const result = applyGoalFilters(goals, withFilters({ status: 'pending', priority: 'high' }));

    expect(result.map(goal => goal.id)).toEqual(['c']);
  });

  it('ordena por título ignorando tildes y mayúsculas', () => {
    expect(applyGoalFilters(goals, withFilters({ sort: 'title' })).map(goal => goal.title)).toEqual([
      'Ahorrar',
      'Árbol',
      'Leer',
      'Meditar'
    ]);
  });

  it('ordena por prioridad con alta primero y mantiene el orden original en empates', () => {
    expect(applyGoalFilters(goals, withFilters({ sort: 'priority' })).map(goal => goal.id)).toEqual([
      'b',
      'c',
      'd',
      'a'
    ]);
  });

  it('ordena por fecha estimada con las fechas más próximas primero y sin fecha al final', () => {
    expect(applyGoalFilters(goals, withFilters({ sort: 'dueDate' })).map(goal => goal.id)).toEqual([
      'c',
      'a',
      'b',
      'd'
    ]);
  });

  it('ordena por progreso con el mayor avance primero', () => {
    expect(applyGoalFilters(goals, withFilters({ sort: 'progress' })).map(goal => goal.id)).toEqual([
      'b',
      'c',
      'a',
      'd'
    ]);
  });

  it('no modifica el arreglo original al ordenar', () => {
    const original = [...goals];

    applyGoalFilters(goals, withFilters({ sort: 'title' }));

    expect(goals).toEqual(original);
  });
});

describe('hasActiveGoalFilters', () => {
  it('ignora el orden al decidir si hay filtros activos', () => {
    expect(hasActiveGoalFilters(DEFAULT_GOAL_FILTERS)).toBe(false);
    expect(hasActiveGoalFilters(withFilters({ sort: 'title' }))).toBe(false);
    expect(hasActiveGoalFilters(withFilters({ kind: 'routine' }))).toBe(true);
  });
});
