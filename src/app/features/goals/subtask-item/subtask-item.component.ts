import { Component, computed, inject, input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { GoalStore } from '../../../core/data/goal.store';
import { notBlank } from '../../../core/forms/validators';
import { Subtask } from '../../../core/models/goal.model';
import { isSubtaskDone, todayIso } from '../../../core/utils/goal-progress';

const SUBTASK_MAX_LENGTH = 120;

@Component({
  selector: 'app-subtask-item',
  imports: [ReactiveFormsModule, SubtaskItemComponent],
  templateUrl: './subtask-item.component.html'
})
export class SubtaskItemComponent {
  protected readonly store = inject(GoalStore);

  readonly goalId = input.required<string>();
  readonly subtask = input.required<Subtask>();

  protected readonly today = todayIso();
  protected readonly done = computed(() => isSubtaskDone(this.subtask()));
  protected readonly inMyDay = computed(() => this.subtask().myDayDate === this.today);

  protected readonly form = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [notBlank, Validators.maxLength(SUBTASK_MAX_LENGTH)]
    })
  });

  protected addChild(): void {
    if (this.form.invalid) {
      return;
    }
    this.store.addSubtask(this.goalId(), this.form.getRawValue().title, this.subtask().id);
    this.form.reset();
  }
}
