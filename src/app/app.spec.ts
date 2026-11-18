import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { App } from './app';
import { GoalRepository } from './core/data/goal.repository';
import { InMemoryGoalRepository } from './testing/in-memory-goal.repository';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: GoalRepository, useClass: InMemoryGoalRepository }
      ]
    }).compileComponents();
  });

  it('crea la aplicación', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renderiza el sidebar con la lista por defecto', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-sidebar')).not.toBeNull();
    expect(compiled.textContent).toContain('Personal');
  });

  it('alterna el menú móvil', () => {
    const fixture = TestBed.createComponent(App);
    fixture.componentInstance['toggleMenu']();
    expect(fixture.componentInstance['menuOpen']()).toBe(true);
    fixture.componentInstance['closeMenu']();
    expect(fixture.componentInstance['menuOpen']()).toBe(false);
  });
});
