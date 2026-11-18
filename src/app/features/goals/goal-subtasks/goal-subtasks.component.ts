import { Component, inject, input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { GoalStore } from '../../../core/data/goal.store';
import { notBlank } from '../../../core/forms/validators';
import { Goal } from '../../../core/models/goal.model';
import { SubtaskItemComponent } from '../subtask-item/subtask-item.component';

const SUBTASK_MAX_LENGTH = 120;

@Component({
  selector: 'app-goal-subtasks',
  imports: [ReactiveFormsModule, SubtaskItemComponent],
  templateUrl: './goal-subtasks.component.html'
})
export class GoalSubtasksComponent {
  protected readonly store = inject(GoalStore);

  readonly goal = input.required<Goal>();

  protected readonly form = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [notBlank, Validators.maxLength(SUBTASK_MAX_LENGTH)]
    })
  });

  protected addSubtask(): void {
    if (this.form.invalid) {
      return;
    }
    this.store.addSubtask(this.goal().id, this.form.getRawValue().title);
    this.form.reset();
  }
}
