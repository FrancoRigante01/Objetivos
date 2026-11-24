import { APP_DATA_VERSION, AppData, LocalStorageGoalRepository } from './goal.repository';

describe('LocalStorageGoalRepository', () => {
  let repository: LocalStorageGoalRepository;

  beforeEach(() => {
    localStorage.clear();
    repository = new LocalStorageGoalRepository();
  });

  it('devuelve datos vacíos cuando no hay nada guardado', () => {
    expect(repository.load()).toEqual({ version: APP_DATA_VERSION, lists: [], goals: [], reminders: [] });
  });

  it('guarda y recupera los datos', () => {
    const data: AppData = {
      version: APP_DATA_VERSION,
      lists: [{ id: 'l1', name: 'Personal', createdAt: '2026-01-01T00:00:00.000Z' }],
      goals: [],
      reminders: []
    };
    repository.save(data);
    expect(repository.load()).toEqual(data);
  });

  it('devuelve datos vacíos si el contenido guardado no es JSON válido', () => {
    localStorage.setItem('objetivos:data', '{no-es-json');
    expect(repository.load()).toEqual({ version: APP_DATA_VERSION, lists: [], goals: [], reminders: [] });
  });

  it('ignora datos con una versión desconocida', () => {
    localStorage.setItem('objetivos:data', JSON.stringify({ version: 999, lists: [], goals: [] }));
    expect(repository.load()).toEqual({ version: APP_DATA_VERSION, lists: [], goals: [], reminders: [] });
  });

  it('migra los datos de la versión 1 hasta la versión actual', () => {
    localStorage.setItem(
      'objetivos:data',
      JSON.stringify({
        version: 1,
        lists: [{ id: 'l1', name: 'Personal', createdAt: '2026-01-01T00:00:00.000Z' }],
        goals: [
          {
            id: 'g1',
            listId: 'l1',
            title: 'Objetivo antiguo',
            description: '',
            dueDate: null,
            priority: 'low',
            completed: false,
            completedAt: null,
            kind: 'one-off',
            routine: null,
            myDayDate: null,
            subtasks: [{ id: 's1', title: 'Subtarea', done: false }],
            createdAt: '2026-01-01T00:00:00.000Z'
          }
        ]
      })
    );

    const data = repository.load();

    expect(data.version).toBe(APP_DATA_VERSION);
    expect(data.goals[0].title).toBe('Objetivo antiguo');
    expect(data.goals[0].subtasks).toEqual([{ id: 's1', title: 'Subtarea', done: false, subtasks: [] }]);
  });
});
