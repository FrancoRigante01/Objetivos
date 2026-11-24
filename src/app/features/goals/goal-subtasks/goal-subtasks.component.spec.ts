import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GoalRepository } from '../../../core/data/goal.repository';
import { Goal } from '../../../core/models/goal.model';
import { todayIso } from '../../../core/utils/goal-progress';
import { InMemoryGoalRepository } from '../../../testing/in-memory-goal.repository';
import { GoalSubtasksComponent } from './goal-subtasks.component';

const GOAL: Goal = {
  id: 'g1',
  listId: 'l1',
  title: 'Aumentar ingresos',
  description: '',
  dueDate: null,
  priority: 'medium',
  completed: false,
  completedAt: null,
  kind: 'one-off',
  routine: null,
  myDayDate: null,
  subtasks: [{ id: 's1', title: 'Aumento de sueldo', done: false, subtasks: [] }],
  createdAt: '2026-01-01T00:00:00.000Z'
};

describe('GoalSubtasksComponent', () => {
  let repository: InMemoryGoalRepository;
  let fixture: ComponentFixture<GoalSubtasksComponent>;
  let element: HTMLElement;

  beforeEach(() => {
    repository = new InMemoryGoalRepository();
    repository.data.lists = [{ id: 'l1', name: 'Personal', createdAt: '2026-01-01T00:00:00.000Z' }];
    repository.data.goals = [structuredClone(GOAL)];

    TestBed.configureTestingModule({
      imports: [GoalSubtasksComponent],
      providers: [{ provide: GoalRepository, useValue: repository }]
    });
    fixture = TestBed.createComponent(GoalSubtasksComponent);
    fixture.componentRef.setInput('goal', GOAL);
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
  });

  function refresh(): void {
    fixture.componentRef.setInput('goal', structuredClone(repository.data.goals[0]));
    fixture.detectChanges();
  }

  function getInput(selector: string): HTMLInputElement {
    const input = element.querySelector<HTMLInputElement>(selector);
    if (!input) {
      throw new Error(`No se encontró ${selector}`);
    }
    return input;
  }

  function typeAndSubmit(selector: string, value: string): void {
    const input = getInput(selector);
    input.value = value;
    input.dispatchEvent(new Event('input'));
    input.form?.dispatchEvent(new Event('submit'));
    refresh();
  }

  function getCheckbox(label: string): HTMLInputElement {
    return getInput(`input[aria-label="${label}"]`);
  }

  it('muestra las subtareas existentes', () => {
    expect(element.textContent).toContain('Aumento de sueldo');
  });

  it('añade una subtarea al enviar el campo', () => {
    typeAndSubmit('input[aria-label="Nueva subtarea"]', '  Trabajo freelance  ');

    expect(repository.data.goals[0].subtasks.map(subtask => subtask.title)).toEqual([
      'Aumento de sueldo',
      'Trabajo freelance'
    ]);
  });

  it('no añade subtareas en blanco', () => {
    typeAndSubmit('input[aria-label="Nueva subtarea"]', '   ');

    expect(repository.data.goals[0].subtasks).toHaveLength(1);
  });

  it('marca una subtarea sin hijas como completada', () => {
    const checkbox = getCheckbox('Completar Aumento de sueldo');
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));

    expect(repository.data.goals[0].subtasks[0].done).toBe(true);
  });

  it('elimina una subtarea', () => {
    element.querySelector<HTMLButtonElement>('button[aria-label="Quitar Aumento de sueldo"]')?.click();

    expect(repository.data.goals[0].subtasks).toHaveLength(0);
  });

  it('añade subtareas dentro de una subtarea', () => {
    typeAndSubmit('input[aria-label="Nueva subtarea en Aumento de sueldo"]', 'Preparar negociación');

    expect(repository.data.goals[0].subtasks[0].subtasks.map(subtask => subtask.title)).toEqual([
      'Preparar negociación'
    ]);
    expect(element.textContent).toContain('Preparar negociación');
  });

  it('bloquea la casilla de la padre mientras tiene hijas y la completa al terminarlas', () => {
    typeAndSubmit('input[aria-label="Nueva subtarea en Aumento de sueldo"]', 'Preparar negociación');
    expect(getCheckbox('Completar Aumento de sueldo').disabled).toBe(true);

    getCheckbox('Completar Preparar negociación').dispatchEvent(new Event('change'));
    refresh();

    expect(repository.data.goals[0].subtasks[0].subtasks[0].done).toBe(true);
    expect(getCheckbox('Completar Aumento de sueldo').checked).toBe(true);
  });

  it('añade una subtarea a "Mi día" desde su fila', () => {
    element.querySelector<HTMLButtonElement>('button[aria-label="Añadir a Mi día Aumento de sueldo"]')?.click();
    refresh();

    expect(repository.data.goals[0].subtasks[0].myDayDate).toBe(todayIso());
    expect(element.querySelector('button[aria-label="Quitar de Mi día Aumento de sueldo"]')).not.toBeNull();
  });

  it('contrae y expande las subtareas con hijas', () => {
    typeAndSubmit('input[aria-label="Nueva subtarea en Aumento de sueldo"]', 'Preparar negociación');
    expect(element.textContent).toContain('Preparar negociación');

    element.querySelector<HTMLButtonElement>('button[aria-label="Contraer Aumento de sueldo"]')?.click();
    refresh();
    expect(element.textContent).not.toContain('Preparar negociación');
    expect(element.querySelector('button[aria-expanded="false"]')).not.toBeNull();

    element.querySelector<HTMLButtonElement>('button[aria-label="Expandir Aumento de sueldo"]')?.click();
    refresh();
    expect(element.textContent).toContain('Preparar negociación');
  });

  it('no muestra el control de contraer en subtareas sin hijas', () => {
    expect(element.querySelector('button[aria-label="Contraer Aumento de sueldo"]')).toBeNull();
    expect(element.querySelector('button[aria-label="Expandir Aumento de sueldo"]')).toBeNull();
  });

  it('permite anidar subtareas varios niveles', () => {
    typeAndSubmit('input[aria-label="Nueva subtarea en Aumento de sueldo"]', 'Preparar negociación');
    typeAndSubmit('input[aria-label="Nueva subtarea en Preparar negociación"]', 'Reunir datos del mercado');

    const nested = repository.data.goals[0].subtasks[0].subtasks[0].subtasks;
    expect(nested.map(subtask => subtask.title)).toEqual(['Reunir datos del mercado']);
  });
});
