import { addRoutineCount, createRoutineState, formatRoutineLastCounted, restartRoutine } from './routine';

describe('routine', () => {
  it('crea una rutina sin racha ni anotaciones', () => {
    expect(createRoutineState()).toEqual({ count: 0, bestCount: 0, lastCountedAt: null });
  });

  it('suma un día, actualiza la mejor racha y guarda la última anotación', () => {
    const routine = addRoutineCount(
      { count: 4, bestCount: 4, lastCountedAt: null },
      '2026-03-10T18:00:00.000Z'
    );
    expect(routine).toEqual({ count: 5, bestCount: 5, lastCountedAt: '2026-03-10T18:00:00.000Z' });
  });

  it('no baja la mejor racha al reiniciar', () => {
    const routine = restartRoutine({ count: 7, bestCount: 12, lastCountedAt: '2026-03-10T18:00:00.000Z' });
    expect(routine).toEqual({ count: 0, bestCount: 12, lastCountedAt: '2026-03-10T18:00:00.000Z' });
  });

  describe('formatRoutineLastCounted', () => {
    const now = new Date(2026, 2, 10, 12, 0);

    it('indica hoy cuando la anotación es del mismo día', () => {
      expect(formatRoutineLastCounted(new Date(2026, 2, 10, 8, 30).toISOString(), now)).toBe('hoy');
    });

    it('indica ayer cuando la anotación es del día anterior', () => {
      expect(formatRoutineLastCounted(new Date(2026, 2, 9, 23, 59).toISOString(), now)).toBe('ayer');
    });

    it('indica los días transcurridos en el resto de los casos', () => {
      expect(formatRoutineLastCounted(new Date(2026, 2, 7, 10, 0).toISOString(), now)).toBe('hace 3 días');
    });
  });
});
