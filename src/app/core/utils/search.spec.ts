import { Goal, GoalList } from '../models/goal.model';
import { normalizeText, searchGoals } from './search';

const LISTS: GoalList[] = [
  { id: 'l1', name: 'Personal', createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'l2', name: 'Trabajo', createdAt: '2026-01-01T00:00:00.000Z' }
];

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
    myDayDate: null,
    subtasks: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides
  };
}

describe('searchGoals', () => {
  it('devuelve vacío si la búsqueda está en blanco', () => {
    const goals = [buildGoal({ title: 'Correr' })];
    expect(searchGoals(goals, LISTS, '   ')).toEqual([]);
  });

  it('ignora mayúsculas y tildes', () => {
    const goals = [buildGoal({ id: 'a', title: 'Ir al Médico' })];
    expect(searchGoals(goals, LISTS, 'medico')).toHaveLength(1);
    expect(searchGoals(goals, LISTS, 'MÉDICO')).toHaveLength(1);
  });

  it('muestra el nombre de la lista de cada resultado', () => {
    const goals = [buildGoal({ id: 'a', title: 'Presentación', listId: 'l2' })];
    const [result] = searchGoals(goals, LISTS, 'presenta');
    expect(result).toMatchObject({ type: 'goal', listName: 'Trabajo' });
  });

  it('busca en la descripción después de los títulos', () => {
    const goals = [
      buildGoal({ id: 'a', description: 'leer libro' }),
      buildGoal({ id: 'b', title: 'Leer más' })
    ];
    expect(searchGoals(goals, LISTS, 'leer').map(result => result.goal.id)).toEqual(['b', 'a']);
  });

  it('encuentra subtareas a cualquier profundidad e indica su ruta', () => {
    const goals = [
      buildGoal({
        id: 'a',
        title: 'Proyecto',
        subtasks: [
          {
            id: 's1',
            title: 'Fase 1',
            done: false,
            subtasks: [{ id: 's2', title: 'Comprar licencia', done: false, subtasks: [] }]
          }
        ]
      })
    ];
    const [result] = searchGoals(goals, LISTS, 'licencia');
    expect(result).toMatchObject({ type: 'subtask', path: ['Fase 1'] });
    expect(result.type === 'subtask' && result.subtask.id).toBe('s2');
  });

  it('limita la cantidad de resultados', () => {
    const goals = Array.from({ length: 30 }, (_, index) => buildGoal({ id: `g${index}`, title: `Tarea ${index}` }));
    expect(searchGoals(goals, LISTS, 'tarea')).toHaveLength(20);
  });
});

describe('normalizeText', () => {
  it('quita tildes y pasa a minúsculas', () => {
    expect(normalizeText('Programación')).toBe('programacion');
  });
});
