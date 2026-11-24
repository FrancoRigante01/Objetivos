import { TestBed } from '@angular/core/testing';

import { InMemoryGoalRepository } from '../../testing/in-memory-goal.repository';
import { GoalRepository } from './goal.repository';
import { GoalStore } from './goal.store';

describe('GoalStore', () => {
  let repository: InMemoryGoalRepository;
  let store: GoalStore;

  beforeEach(() => {
    repository = new InMemoryGoalRepository();
    TestBed.configureTestingModule({
      providers: [{ provide: GoalRepository, useValue: repository }]
    });
    store = TestBed.inject(GoalStore);
  });

  it('crea una lista por defecto cuando no hay datos', () => {
    expect(store.lists().map(list => list.name)).toEqual(['Personal']);
    expect(repository.data.lists.length).toBe(1);
  });

  it('añade un objetivo y lo persiste', () => {
    const listId = store.lists()[0].id;
    const goal = store.addGoal({ listId, title: '  Correr 5k  ', priority: 'high' });

    expect(goal.title).toBe('Correr 5k');
    expect(store.goals()).toEqual([goal]);
    expect(repository.data.goals).toEqual([goal]);
  });

  it('reordena los objetivos y persiste el nuevo orden', () => {
    const listId = store.lists()[0].id;
    const first = store.addGoal({ listId, title: 'Primero' });
    store.addGoal({ listId, title: 'Segundo' });
    const third = store.addGoal({ listId, title: 'Tercero' });

    store.moveGoal(first.id, third.id);

    expect(store.goals().map(goal => goal.title)).toEqual(['Segundo', 'Tercero', 'Primero']);
    expect(repository.data.goals.map(goal => goal.title)).toEqual(['Segundo', 'Tercero', 'Primero']);
  });

  it('marca un objetivo como completado y registra la fecha', () => {
    const goal = store.addGoal({ listId: store.lists()[0].id, title: 'Leer' });

    store.toggleCompleted(goal.id);
    expect(store.goals()[0].completed).toBe(true);
    expect(store.goals()[0].completedAt).not.toBeNull();

    store.toggleCompleted(goal.id);
    expect(store.goals()[0].completed).toBe(false);
    expect(store.goals()[0].completedAt).toBeNull();
  });

  it('alterna la inclusión en "Mi día" según la fecha indicada', () => {
    const goal = store.addGoal({ listId: store.lists()[0].id, title: 'Estudiar' });

    store.toggleMyDay(goal.id, '2026-03-10');
    expect(store.goals()[0].myDayDate).toBe('2026-03-10');

    store.toggleMyDay(goal.id, '2026-03-10');
    expect(store.goals()[0].myDayDate).toBeNull();
  });

  it('gestiona subtareas', () => {
    const goal = store.addGoal({ listId: store.lists()[0].id, title: 'Proyecto' });

    store.addSubtask(goal.id, 'Diseñar');
    store.addSubtask(goal.id, 'Programar');
    const [first] = store.goals()[0].subtasks;

    store.toggleSubtask(goal.id, first.id);
    expect(store.goals()[0].subtasks[0].done).toBe(true);

    store.removeSubtask(goal.id, first.id);
    expect(store.goals()[0].subtasks.map(subtask => subtask.title)).toEqual(['Programar']);
  });

  it('renombra una subtarea anidada, sin espacios sobrantes, y lo persiste', () => {
    const goal = store.addGoal({ listId: store.lists()[0].id, title: 'Proyecto' });
    store.addSubtask(goal.id, 'Fase 1');
    const parentId = store.goals()[0].subtasks[0].id;
    store.addSubtask(goal.id, 'Tarea vieja', parentId);
    const childId = store.goals()[0].subtasks[0].subtasks[0].id;

    store.renameSubtask(goal.id, childId, '  Tarea nueva  ');

    expect(store.goals()[0].subtasks[0].subtasks[0].title).toBe('Tarea nueva');
    expect(store.goals()[0].subtasks[0].title).toBe('Fase 1');
  });

  it('alterna la inclusión de una subtarea en "Mi día"', () => {
    const goal = store.addGoal({ listId: store.lists()[0].id, title: 'Ingresos' });
    store.addSubtask(goal.id, 'Redactar propuesta');
    const subtaskId = store.goals()[0].subtasks[0].id;

    store.toggleSubtaskMyDay(goal.id, subtaskId, '2026-03-10');
    expect(store.goals()[0].subtasks[0].myDayDate).toBe('2026-03-10');

    store.toggleSubtaskMyDay(goal.id, subtaskId, '2026-03-10');
    expect(store.goals()[0].subtasks[0].myDayDate).toBeNull();
  });

  it('marcar una subtarea como hecha hoy no cambia su estado global', () => {
    const goal = store.addGoal({ listId: store.lists()[0].id, title: 'Rutina' });
    store.addSubtask(goal.id, 'Hacer ejercicio');
    const subtaskId = store.goals()[0].subtasks[0].id;

    store.toggleSubtaskDoneToday(goal.id, subtaskId, '2026-03-10');
    expect(store.goals()[0].subtasks[0].myDayDoneDate).toBe('2026-03-10');
    expect(store.goals()[0].subtasks[0].done).toBe(false);

    store.toggleSubtaskDoneToday(goal.id, subtaskId, '2026-03-10');
    expect(store.goals()[0].subtasks[0].myDayDoneDate).toBeNull();
  });

  it('alterna el estado contraído de una subtarea', () => {
    const goal = store.addGoal({ listId: store.lists()[0].id, title: 'Ingresos' });
    store.addSubtask(goal.id, 'Padre');
    const parentId = store.goals()[0].subtasks[0].id;

    store.toggleSubtaskCollapsed(goal.id, parentId);
    expect(store.goals()[0].subtasks[0].collapsed).toBe(true);

    store.toggleSubtaskCollapsed(goal.id, parentId);
    expect(store.goals()[0].subtasks[0].collapsed).toBe(false);
  });

  it('gestiona subtareas anidadas a cualquier profundidad', () => {
    const goal = store.addGoal({ listId: store.lists()[0].id, title: 'Ingresos' });
    store.addSubtask(goal.id, 'Aumento de sueldo');
    const salaryId = store.goals()[0].subtasks[0].id;

    store.addSubtask(goal.id, 'Preparar negociación', salaryId);
    const negotiationId = store.goals()[0].subtasks[0].subtasks[0].id;

    store.addSubtask(goal.id, 'Reunir datos', negotiationId);
    const dataId = store.goals()[0].subtasks[0].subtasks[0].subtasks[0].id;
    expect(store.goals()[0].subtasks[0].subtasks[0].subtasks.map(subtask => subtask.title)).toEqual(['Reunir datos']);

    store.toggleSubtask(goal.id, dataId);
    expect(store.goals()[0].subtasks[0].subtasks[0].subtasks[0].done).toBe(true);

    store.removeSubtask(goal.id, negotiationId);
    expect(store.goals()[0].subtasks[0].subtasks).toHaveLength(0);
  });

  it('elimina una lista junto con sus objetivos', () => {
    const personal = store.lists()[0];
    const work = store.addList('Trabajo');
    store.addGoal({ listId: personal.id, title: 'Personal 1' });
    store.addGoal({ listId: work.id, title: 'Trabajo 1' });

    store.removeList(work.id);

    expect(store.lists().map(list => list.id)).toEqual([personal.id]);
    expect(store.goals().map(goal => goal.title)).toEqual(['Personal 1']);
  });

  it('reemplaza todos los datos y persiste el resultado', () => {
    store.addGoal({ listId: store.lists()[0].id, title: 'Antiguo' });
    const imported = {
      lists: [{ id: 'x1', name: 'Importada', createdAt: '2026-01-01T00:00:00.000Z' }],
      goals: [],
      reminders: []
    };

    store.replaceAll(imported);

    expect(store.lists().map(list => list.name)).toEqual(['Importada']);
    expect(store.goals()).toEqual([]);
    expect(repository.data.lists.map(list => list.name)).toEqual(['Importada']);
  });

  it('crea una rutina con racha en cero y sin fecha estimada', () => {
    const goal = store.addGoal({ listId: store.lists()[0].id, title: 'Mantener postura', kind: 'routine' });

    expect(goal.kind).toBe('routine');
    expect(goal.routine).toEqual({ count: 0, bestCount: 0, lastCountedAt: null });
  });

  it('suma días a la racha y guarda la fecha de la última anotación', () => {
    const goal = store.addGoal({ listId: store.lists()[0].id, title: 'Postura', kind: 'routine' });

    store.addRoutineCount(goal.id, new Date(2026, 2, 10, 18, 0));
    store.addRoutineCount(goal.id, new Date(2026, 2, 8, 9, 0));

    expect(store.goals()[0].routine).toEqual({
      count: 2,
      bestCount: 2,
      lastCountedAt: new Date(2026, 2, 8, 9, 0).toISOString()
    });
  });

  it('completa la rutina al llegar a 90 días y no admite más anotaciones', () => {
    const goal = store.addGoal({ listId: store.lists()[0].id, title: 'Postura', kind: 'routine' });
    const now = new Date(2026, 2, 10, 18, 0);
    for (let day = 0; day < 90; day++) {
      store.addRoutineCount(goal.id, now);
    }

    expect(store.goals()[0].completed).toBe(true);
    expect(store.goals()[0].completedAt).toBe(now.toISOString());
    expect(store.goals()[0].routine?.count).toBe(90);

    store.addRoutineCount(goal.id, now);
    store.restartRoutine(goal.id);
    expect(store.goals()[0].routine?.count).toBe(90);
  });

  it('reinicia la racha conservando la mejor marca', () => {
    const goal = store.addGoal({ listId: store.lists()[0].id, title: 'Postura', kind: 'routine' });
    store.addRoutineCount(goal.id);
    store.addRoutineCount(goal.id);
    store.addRoutineCount(goal.id);

    store.restartRoutine(goal.id);

    expect(store.goals()[0].routine?.count).toBe(0);
    expect(store.goals()[0].routine?.bestCount).toBe(3);
  });

  it('cambia el tipo de un objetivo al editarlo', () => {
    const goal = store.addGoal({ listId: store.lists()[0].id, title: 'Leer' });

    store.updateGoal(goal.id, { kind: 'routine' });
    expect(store.goals()[0].kind).toBe('routine');
    expect(store.goals()[0].routine).toEqual({ count: 0, bestCount: 0, lastCountedAt: null });

    store.addRoutineCount(goal.id);
    store.updateGoal(goal.id, { title: 'Leer más', kind: 'routine' });
    expect(store.goals()[0].routine?.count).toBe(1);

    store.updateGoal(goal.id, { kind: 'one-off' });
    expect(store.goals()[0].kind).toBe('one-off');
    expect(store.goals()[0].routine).toBeNull();
  });

  it('ignora las acciones de rutina sobre un objetivo puntual', () => {
    const goal = store.addGoal({ listId: store.lists()[0].id, title: 'Leer' });

    store.addRoutineCount(goal.id);
    store.restartRoutine(goal.id);

    expect(store.goals()[0].kind).toBe('one-off');
    expect(store.goals()[0].routine).toBeNull();
  });

  it('crea una lista por defecto si la importación no trae ninguna', () => {
    store.replaceAll({ lists: [], goals: [], reminders: [] });

    expect(store.lists().map(list => list.name)).toEqual(['Personal']);
  });

  it('añade, edita, completa y elimina recordatorios y los persiste', () => {
    const reminder = store.addReminder({ title: '  Pagar factura  ', remindAt: '2026-03-10T18:00' });
    expect(reminder.title).toBe('Pagar factura');
    expect(repository.data.reminders).toEqual([reminder]);

    store.updateReminder(reminder.id, { title: 'Pagar luz', remindAt: '2026-03-11T09:00' });
    expect(store.reminders()[0].title).toBe('Pagar luz');
    expect(store.reminders()[0].remindAt).toBe('2026-03-11T09:00');

    store.toggleReminderDone(reminder.id);
    expect(store.reminders()[0].done).toBe(true);

    store.removeReminder(reminder.id);
    expect(store.reminders()).toEqual([]);
    expect(repository.data.reminders).toEqual([]);
  });

  it('elimina los recordatorios al reemplazar los datos sin ellos', () => {
    store.addReminder({ title: 'Antiguo', remindAt: '2026-03-10T18:00' });

    store.replaceAll({ lists: [], goals: [], reminders: [] });

    expect(store.reminders()).toEqual([]);
  });

  it('recupera el estado previo desde el repositorio', () => {
    const listId = store.lists()[0].id;
    store.addGoal({ listId, title: 'Persistido' });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: GoalRepository, useValue: repository }]
    });
    const reloaded = TestBed.inject(GoalStore);

    expect(reloaded.goals().map(goal => goal.title)).toEqual(['Persistido']);
  });
});
