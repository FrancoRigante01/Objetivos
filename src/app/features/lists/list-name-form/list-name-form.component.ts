import { Component, OnInit, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { notBlank } from '../../../core/forms/validators';

const NAME_MAX_LENGTH = 60;

@Component({
  selector: 'app-list-name-form',
  imports: [ReactiveFormsModule],
  templateUrl: './list-name-form.component.html'
})
export class ListNameFormComponent implements OnInit {
  readonly name = input('');
  readonly submitLabel = input('Guardar');

  readonly saved = output<string>();
  readonly cancelled = output<void>();

  protected readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, notBlank, Validators.maxLength(NAME_MAX_LENGTH)]
    })
  });

  ngOnInit(): void {
    this.form.setValue({ name: this.name() });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saved.emit(this.form.getRawValue().name.trim());
  }
}
