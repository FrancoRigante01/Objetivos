import { RoutineState } from '../models/goal.model';

export function createRoutineState(): RoutineState {
  return { count: 0, bestCount: 0, lastCountedAt: null };
}

export function addRoutineCount(routine: RoutineState, nowIso: string): RoutineState {
  const count = routine.count + 1;
  return { count, bestCount: Math.max(routine.bestCount, count), lastCountedAt: nowIso };
}

export function restartRoutine(routine: RoutineState): RoutineState {
  return { ...routine, count: 0 };
}

export function formatRoutineLastCounted(lastCountedAt: string, now: Date = new Date()): string {
  const daysAgo = calendarDaysBetween(new Date(lastCountedAt), now);
  if (daysAgo <= 0) {
    return 'hoy';
  }
  if (daysAgo === 1) {
    return 'ayer';
  }
  return `hace ${daysAgo} días`;
}

function calendarDaysBetween(from: Date, to: Date): number {
  const start = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const end = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((end - start) / 86_400_000);
}
