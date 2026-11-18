import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListNameFormComponent } from './list-name-form.component';

describe('ListNameFormComponent', () => {
  let fixture: ComponentFixture<ListNameFormComponent>;
  let element: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ListNameFormComponent] });
    fixture = TestBed.createComponent(ListNameFormComponent);
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
  });

  function submitName(value: string): void {
    const input = element.querySelector<HTMLInputElement>('input');
    if (!input) {
      throw new Error('No se encontró el input');
    }
    input.value = value;
    input.dispatchEvent(new Event('input'));
    element.querySelector('form')?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  it('emite el nombre sin espacios sobrantes', () => {
    const spy = vi.fn();
    fixture.componentInstance.saved.subscribe(spy);

    submitName('  Trabajo  ');

    expect(spy).toHaveBeenCalledWith('Trabajo');
  });

  it('no emite un nombre en blanco', () => {
    const spy = vi.fn();
    fixture.componentInstance.saved.subscribe(spy);

    submitName('   ');

    expect(spy).not.toHaveBeenCalled();
  });

  it('emite cancelled al pulsar el botón Cancelar', () => {
    const spy = vi.fn();
    fixture.componentInstance.cancelled.subscribe(spy);

    const cancel = Array.from(element.querySelectorAll('button')).find(button => button.textContent?.trim() === 'Cancelar');
    cancel?.click();

    expect(spy).toHaveBeenCalled();
  });
});
