import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { GoalRepository } from '../../../core/data/goal.repository';
import { GoalStore } from '../../../core/data/goal.store';
import { todayIso } from '../../../core/utils/goal-progress';
import { InMemoryGoalRepository } from '../../../testing/in-memory-goal.repository';
import { TaskViewComponent } from './task-view.component';

describe('TaskViewComponent', () => {
  let repository: InMemoryGoalRepository;
  let fixture: ComponentFixture<TaskViewComponent>;
  let element: HTMLElement;

  beforeEach(() => {
    repository = new InMemoryGoalRepository();
    repository.data.lists = [
      { id: 'l1', name: 'Personal', createdAt: '2026-01-01T00:00:00.000Z' },
      { id: 'l2', name: 'Trabajo', createdAt: '2026-01-01T00:00:00.000Z' }
    ];
    repository.data.goals = [
      {
        id: 'g1',
        listId: 'l1',
        title: 'Para hoy',
        description: '',
        dueDate: null,
        priority: 'medium',
        completed: false,
        completedAt: null,
        myDayDate: todayIso(),
        subtasks: [],
        createdAt: '2026-01-01T00:00:00.000Z'
      },
      {
        id: 'g2',
        listId: 'l2',
        title: 'Del trabajo',
        description: '',
        dueDate: null,
        priority: 'high',
        completed: false,
        completedAt: null,
        myDayDate: null,
        subtasks: [],
        createdAt: '2026-01-01T00:00:00.000Z'
      }
    ];

    TestBed.configureTestingModule({
      imports: [TaskViewComponent],
      providers: [provideRouter([]), { provide: GoalRepository, useValue: repository }]
    });
    fixture = TestBed.createComponent(TaskViewComponent);
    element = fixture.nativeElement as HTMLElement;
  });

  function renderedItems(): string[] {
    return Array.from(element.querySelectorAll('li')).map(item => item.textContent?.trim() ?? '');
  }

  function findButton(text: string): HTMLButtonElement | undefined {
    return Array.from(element.querySelectorAll('button')).find(button => button.textContent?.trim() === text);
  }

  function setInputValue(selector: string, value: string): void {
    const input = element.querySelector<HTMLInputElement>(selector);
    if (!input) {
      throw new Error(`No se encontró ${selector}`);
    }
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  it('muestra solo los objetivos de "Mi día" en la vista inteligente', () => {
    fixture.componentRef.setInput('smartList', 'myDay');
    fixture.detectChanges();

    expect(fixture.componentInstance['title']()).toBe('Mi día');
    expect(renderedItems()).toHaveLength(1);
    expect(renderedItems()[0]).toContain('Para hoy');
  });

  it('muestra los objetivos de una lista concreta', () => {
    fixture.componentRef.setInput('listId', 'l2');
    fixture.detectChanges();

    expect(fixture.componentInstance['title']()).toBe('Trabajo');
    expect(renderedItems()).toHaveLength(1);
    expect(renderedItems()[0]).toContain('Del trabajo');
  });

  it('marca un objetivo como completado desde la lista', () => {
    fixture.componentRef.setInput('listId', 'l1');
    fixture.detectChanges();

    TestBed.inject(GoalStore).toggleCompleted('g1');
    fixture.detectChanges();

    expect(repository.data.goals.find(goal => goal.id === 'g1')?.completed).toBe(true);
  });

  it('muestra un mensaje cuando la vista está vacía', () => {
    fixture.componentRef.setInput('listId', 'inexistente');
    fixture.detectChanges();

    expect(element.textContent).toContain('No hay objetivos en esta vista.');
  });

  it('crea un objetivo desde el formulario', () => {
    fixture.componentRef.setInput('smartList', 'myDay');
    fixture.detectChanges();

    findButton('Nuevo objetivo')?.click();
    fixture.detectChanges();
    setInputValue('#goal-title', 'Nuevo objetivo');
    element.querySelector('form')?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(repository.data.goals.map(goal => goal.title)).toContain('Nuevo objetivo');
    expect(element.querySelector('#goal-title')).toBeNull();
  });

  it('elimina un objetivo tras confirmar', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    fixture.componentRef.setInput('smartList', 'myDay');
    fixture.detectChanges();

    findButton('Eliminar')?.click();
    fixture.detectChanges();

    expect(repository.data.goals.map(goal => goal.id)).toEqual(['g2']);
  });

  it('no elimina un objetivo si el usuario cancela', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    fixture.componentRef.setInput('smartList', 'myDay');
    fixture.detectChanges();

    findButton('Eliminar')?.click();
    fixture.detectChanges();

    expect(repository.data.goals).toHaveLength(2);
  });

  it('añade un objetivo a "Mi día" desde la lista', () => {
    fixture.componentRef.setInput('listId', 'l2');
    fixture.detectChanges();

    findButton('Añadir a Mi día')?.click();
    fixture.detectChanges();

    expect(repository.data.goals.find(goal => goal.id === 'g2')?.myDayDate).toBe(todayIso());
    expect(findButton('Quitar de Mi día')).toBeDefined();
  });

  it('muestra las subtareas añadidas a "Mi día" junto con el objetivo al que pertenecen', () => {
    const store = TestBed.inject(GoalStore);
    store.addSubtask('g2', 'Redactar propuesta');
    store.toggleSubtaskMyDay('g2', store.goals().find(goal => goal.id === 'g2')?.subtasks[0].id ?? '');

    fixture.componentRef.setInput('smartList', 'myDay');
    fixture.detectChanges();

    expect(element.textContent).toContain('Redactar propuesta');
    expect(element.textContent).toContain('Del trabajo');
    expect(fixture.componentInstance['pendingCount']()).toBe(2);
  });

  it('muestra la rama completa de una subtarea anidada en "Mi día"', () => {
    const store = TestBed.inject(GoalStore);
    store.addSubtask('g2', 'Aumento de sueldo');
    const parentId = store.goals().find(goal => goal.id === 'g2')?.subtasks[0].id ?? '';
    store.addSubtask('g2', 'Preparar negociación', parentId);
    const childId = store.goals().find(goal => goal.id === 'g2')?.subtasks[0].subtasks[0].id ?? '';
    store.toggleSubtaskMyDay('g2', childId);

    fixture.componentRef.setInput('smartList', 'myDay');
    fixture.detectChanges();

    expect(element.textContent).toContain('Del trabajo › Aumento de sueldo');
  });

  it('marcar una subtarea en "Mi día" no la completa en la lista del objetivo', () => {
    const store = TestBed.inject(GoalStore);
    store.addSubtask('g2', 'Hacer ejercicio');
    const subtaskId = store.goals().find(goal => goal.id === 'g2')?.subtasks[0].id ?? '';
    store.toggleSubtaskMyDay('g2', subtaskId);

    fixture.componentRef.setInput('smartList', 'myDay');
    fixture.detectChanges();
    element.querySelector<HTMLInputElement>('input[aria-label="Hecha hoy: Hacer ejercicio"]')?.click();
    fixture.detectChanges();

    const subtask = repository.data.goals.find(goal => goal.id === 'g2')?.subtasks[0];
    expect(subtask?.myDayDoneDate).toBe(todayIso());
    expect(subtask?.done).toBe(false);
    expect(fixture.componentInstance['pendingCount']()).toBe(1);
  });

  it('quita una subtarea de "Mi día" desde la vista', () => {
    const store = TestBed.inject(GoalStore);
    store.addSubtask('g2', 'Redactar propuesta');
    const subtaskId = store.goals().find(goal => goal.id === 'g2')?.subtasks[0].id ?? '';
    store.toggleSubtaskMyDay('g2', subtaskId);

    fixture.componentRef.setInput('smartList', 'myDay');
    fixture.detectChanges();
    element.querySelector<HTMLButtonElement>('button[aria-label="Quitar de Mi día Redactar propuesta"]')?.click();
    fixture.detectChanges();

    expect(repository.data.goals.find(goal => goal.id === 'g2')?.subtasks[0].myDayDate).toBeNull();
    expect(element.textContent).not.toContain('Redactar propuesta');
  });

  it('elimina la lista actual y sus objetivos', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    fixture.componentRef.setInput('listId', 'l2');
    fixture.detectChanges();

    findButton('Eliminar lista')?.click();
    fixture.detectChanges();

    expect(repository.data.lists.map(list => list.id)).toEqual(['l1']);
    expect(repository.data.goals.map(goal => goal.id)).toEqual(['g1']);
  });

  it('renombra la lista actual', () => {
    fixture.componentRef.setInput('listId', 'l1');
    fixture.detectChanges();

    findButton('Renombrar')?.click();
    fixture.detectChanges();
    setInputValue('input[aria-label="Nombre de la lista"]', 'Casa');
    element.querySelector('input[aria-label="Nombre de la lista"]')?.closest('form')?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(repository.data.lists.find(list => list.id === 'l1')?.name).toBe('Casa');
  });
});
