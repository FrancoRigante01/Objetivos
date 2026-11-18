import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GoalRepository } from '../../../core/data/goal.repository';
import { Goal } from '../../../core/models/goal.model';
import { InMemoryGoalRepository } from '../../../testing/in-memory-goal.repository';
import { GoalFormComponent } from './goal-form.component';

const EXISTING_GOAL: Goal = {
  id: 'g1',
  listId: 'l1',
  title: 'Existente',
  description: 'Detalle',
  dueDate: '2026-06-01',
  priority: 'high',
  completed: false,
  completedAt: null,
  myDayDate: null,
  subtasks: [],
  createdAt: '2026-01-01T00:00:00.000Z'
};

describe('GoalFormComponent', () => {
  let element: HTMLElement;

  beforeEach(() => {
    const repository = new InMemoryGoalRepository();
    repository.data.lists = [{ id: 'l1', name: 'Personal', createdAt: '2026-01-01T00:00:00.000Z' }];

    TestBed.configureTestingModule({
      imports: [GoalFormComponent],
      providers: [{ provide: GoalRepository, useValue: repository }]
    });
  });

  function createForm(goal?: Goal): ComponentFixture<GoalFormComponent> {
    const fixture = TestBed.createComponent(GoalFormComponent);
    fixture.componentRef.setInput('defaultListId', 'l1');
    if (goal) {
      fixture.componentRef.setInput('goal', goal);
    }
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
    return fixture;
  }

  function setValue(selector: string, value: string): void {
    const field = element.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(selector);
    if (!field) {
      throw new Error(`No se encontró ${selector}`);
    }
    field.value = value;
    field.dispatchEvent(new Event('input'));
    field.dispatchEvent(new Event('change'));
  }

  function submit(fixture: ComponentFixture<GoalFormComponent>): void {
    element.querySelector('form')?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  it('emite el borrador con la fecha en null cuando no se indica', () => {
    const fixture = createForm();
    const spy = vi.fn();
    fixture.componentInstance.submitted.subscribe(spy);

    setValue('#goal-title', '  Leer 12 libros  ');
    submit(fixture);

    expect(spy).toHaveBeenCalledWith({
      listId: 'l1',
      title: 'Leer 12 libros',
      description: '',
      dueDate: null,
      priority: 'medium'
    });
  });

  it('no emite cuando el título está vacío', () => {
    const fixture = createForm();
    const spy = vi.fn();
    fixture.componentInstance.submitted.subscribe(spy);

    setValue('#goal-title', '   ');
    submit(fixture);

    expect(spy).not.toHaveBeenCalled();
    expect(element.textContent).toContain('El título es obligatorio.');
  });

  it('rellena el formulario con los datos del objetivo al editar', () => {
    createForm(EXISTING_GOAL);

    expect(element.querySelector<HTMLInputElement>('#goal-title')?.value).toBe('Existente');
    expect(element.querySelector<HTMLInputElement>('#goal-due-date')?.value).toBe('2026-06-01');
    expect(element.querySelector<HTMLSelectElement>('#goal-priority')?.value).toBe('high');
  });
});
