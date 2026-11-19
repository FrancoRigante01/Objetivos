import { APP_DATA_VERSION, AppData, parseAppData, serializeAppData } from './app-data';

const INVALID = 'El archivo no es una copia válida de Objetivos.';

const DATA: AppData = {
  version: APP_DATA_VERSION,
  lists: [{ id: 'l1', name: 'Personal', createdAt: '2026-01-01T00:00:00.000Z' }],
  goals: [
    {
      id: 'g1',
      listId: 'l1',
      title: 'Aumentar ingresos',
      description: 'Plan anual',
      dueDate: '2026-12-31',
      priority: 'high',
      completed: false,
      completedAt: null,
      myDayDate: null,
      subtasks: [
        {
          id: 's1',
          title: 'Aumento de sueldo',
          done: false,
          collapsed: true,
          subtasks: [
            {
              id: 's2',
              title: 'Preparar negociación',
              done: false,
              subtasks: [{ id: 's3', title: 'Reunir datos del mercado', done: true, subtasks: [] }]
            }
          ]
        }
      ],
      createdAt: '2026-01-01T00:00:00.000Z'
    }
  ],
  reminders: [
    { id: 'r1', title: 'Renovar seguro', remindAt: '2026-06-01T09:30', done: false, createdAt: '2026-01-01T00:00:00.000Z' }
  ]
};

describe('app-data', () => {
  it('recupera exactamente los datos exportados, incluidas las subtareas anidadas y los recordatorios', () => {
    expect(parseAppData(serializeAppData(DATA))).toEqual(DATA);
  });

  it('rechaza recordatorios con campos inválidos', () => {
    const broken = structuredClone(DATA);
    (broken.reminders[0] as unknown as Record<string, unknown>)['done'] = 'no';
    expect(() => parseAppData(JSON.stringify(broken))).toThrowError(INVALID);
  });

  it('migra copias de la versión 3 añadiendo una lista de recordatorios vacía', () => {
    const legacy = { version: 3, lists: DATA.lists, goals: DATA.goals };

    const data = parseAppData(JSON.stringify(legacy));

    expect(data).toEqual({ version: APP_DATA_VERSION, lists: DATA.lists, goals: DATA.goals, reminders: [] });
  });

  it('rechaza texto que no es JSON', () => {
    expect(() => parseAppData('{no-es-json')).toThrowError(INVALID);
  });

  it('rechaza una estructura incorrecta', () => {
    const broken = JSON.stringify({ version: APP_DATA_VERSION, lists: 'no', goals: [] });
    expect(() => parseAppData(broken)).toThrowError(INVALID);
  });

  it('rechaza objetivos con campos inválidos', () => {
    const broken = structuredClone(DATA);
    (broken.goals[0] as unknown as Record<string, unknown>)['priority'] = 'urgent';
    expect(() => parseAppData(JSON.stringify(broken))).toThrowError(INVALID);
  });

  it('rechaza subtareas anidadas con campos inválidos', () => {
    const broken = structuredClone(DATA);
    (broken.goals[0].subtasks[0].subtasks[0].subtasks[0] as unknown as Record<string, unknown>)['done'] = 'sí';
    expect(() => parseAppData(JSON.stringify(broken))).toThrowError(INVALID);
  });

  it('migra copias de la versión 1 a la estructura actual', () => {
    const legacy = {
      version: 1,
      lists: DATA.lists,
      goals: [{ ...DATA.goals[0], subtasks: [{ id: 's1', title: 'Subtarea', done: false }] }]
    };

    const data = parseAppData(JSON.stringify(legacy));

    expect(data.version).toBe(APP_DATA_VERSION);
    expect(data.goals[0].subtasks).toEqual([{ id: 's1', title: 'Subtarea', done: false, subtasks: [] }]);
  });

  it('migra copias de la versión 2 convirtiendo las tareas en subtareas', () => {
    const legacy = {
      version: 2,
      lists: DATA.lists,
      goals: [
        {
          ...DATA.goals[0],
          subtasks: [
            {
              id: 's1',
              title: 'Aumento de sueldo',
              done: false,
              tasks: [{ id: 't1', title: 'Preparar negociación', done: true }]
            }
          ]
        }
      ]
    };

    const data = parseAppData(JSON.stringify(legacy));

    expect(data.goals[0].subtasks).toEqual([
      {
        id: 's1',
        title: 'Aumento de sueldo',
        done: false,
        subtasks: [{ id: 't1', title: 'Preparar negociación', done: true, subtasks: [] }]
      }
    ]);
  });
});
