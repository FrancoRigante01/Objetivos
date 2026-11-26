import { TestBed } from '@angular/core/testing';

import { ClockService } from './clock.service';

describe('ClockService', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('actualiza la fecha de hoy al cambiar de día', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 1, 23, 59));
    const clock = TestBed.inject(ClockService);
    expect(clock.today()).toBe('2026-01-01');

    vi.advanceTimersByTime(2 * 60_000);

    expect(clock.today()).toBe('2026-01-02');
    expect(clock.nowIso()).toBe('2026-01-02T00:01');
  });
});
