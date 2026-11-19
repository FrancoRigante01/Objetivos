import { Component, OnInit, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { notBlank } from '../../../core/forms/validators';
import { Reminder, ReminderDraft } from '../../../core/models/goal.model';

const TITLE_MAX_LENGTH = 120;

@Component({
  selector: 'app-reminder-form',
  imports: [ReactiveFormsModule],
  templateUrl: './reminder-form.component.html'
})
export class ReminderFormComponent implements OnInit {
  readonly reminder = input<Reminder>();

  readonly submitted = output<ReminderDraft>();
  readonly cancelled = output<void>();

  protected readonly form = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, notBlank, Validators.maxLength(TITLE_MAX_LENGTH)]
    }),
    remindAt: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  ngOnInit(): void {
    const reminder = this.reminder();
    this.form.setValue({
      title: reminder?.title ?? '',
      remindAt: reminder?.remindAt ?? ''
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
    this.submitted.emit({ title: value.title.trim(), remindAt: value.remindAt });
  }
}
