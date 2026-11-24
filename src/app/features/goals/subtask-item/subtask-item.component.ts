import { Component, ElementRef, Injector, afterNextRender, computed, inject, input, signal, viewChild } from '@angular/core';
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
  private readonly injector = inject(Injector);

  readonly goalId = input.required<string>();
  readonly subtask = input.required<Subtask>();

  protected readonly today = todayIso();
  protected readonly done = computed(() => isSubtaskDone(this.subtask()));
  protected readonly inMyDay = computed(() => this.subtask().myDayDate === this.today);
  protected readonly editing = signal(false);

  private readonly editInput = viewChild<ElementRef<HTMLInputElement>>('editInput');

  protected readonly form = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [notBlank, Validators.maxLength(SUBTASK_MAX_LENGTH)]
    })
  });

  protected readonly editForm = new FormGroup({
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

  protected startEdit(): void {
    this.editForm.setValue({ title: this.subtask().title });
    this.editing.set(true);
    afterNextRender(() => this.editInput()?.nativeElement.focus(), { injector: this.injector });
  }

  protected saveEdit(): void {
    if (!this.editing()) {
      return;
    }
    this.editing.set(false);
    if (this.editForm.valid) {
      this.store.renameSubtask(this.goalId(), this.subtask().id, this.editForm.getRawValue().title);
    }
  }

  protected cancelEdit(): void {
    this.editing.set(false);
  }
}
