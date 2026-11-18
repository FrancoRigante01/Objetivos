import { AfterViewInit, Component, OnInit, inject, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { GoalStore } from '../../../core/data/goal.store';
import { notBlank } from '../../../core/forms/validators';
import { Goal, GoalDraft, PRIORITY_LABELS, Priority } from '../../../core/models/goal.model';

const TITLE_MAX_LENGTH = 120;
const DESCRIPTION_MAX_LENGTH = 500;

@Component({
  selector: 'app-goal-form',
  imports: [ReactiveFormsModule],
  templateUrl: './goal-form.component.html'
})
export class GoalFormComponent implements OnInit, AfterViewInit {
  private readonly store = inject(GoalStore);

  readonly goal = input<Goal>();
  readonly defaultListId = input.required<string>();

  readonly submitted = output<GoalDraft>();
  readonly cancelled = output<void>();

  protected readonly lists = this.store.lists;
  protected readonly priorityOptions = (['low', 'medium', 'high'] as Priority[]).map(value => ({
    value,
    label: PRIORITY_LABELS[value]
  }));

  protected readonly form = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, notBlank, Validators.maxLength(TITLE_MAX_LENGTH)]
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(DESCRIPTION_MAX_LENGTH)]
    }),
    listId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    dueDate: new FormControl('', { nonNullable: true }),
    priority: new FormControl<Priority>('medium', { nonNullable: true })
  });

  ngOnInit(): void {
    this.loadInitialValues();
  }

  ngAfterViewInit(): void {
    // Los <option> de listas se renderizan en la vista; hay que reasignar los valores para que los selects los muestren.
    this.loadInitialValues();
  }

  private loadInitialValues(): void {
    const goal = this.goal();
    this.form.setValue({
      title: goal?.title ?? '',
      description: goal?.description ?? '',
      listId: goal?.listId ?? this.defaultListId(),
      dueDate: goal?.dueDate ?? '',
      priority: goal?.priority ?? 'medium'
    });
  }

  protected titleError(): string {
    return this.form.controls.title.hasError('maxlength')
      ? `Máximo ${TITLE_MAX_LENGTH} caracteres.`
      : 'El título es obligatorio.';
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.submitted.emit({
      listId: value.listId,
      title: value.title.trim(),
      description: value.description.trim(),
      dueDate: value.dueDate || null,
      priority: value.priority
    });
  }
}
