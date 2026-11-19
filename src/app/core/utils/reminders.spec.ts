import { Reminder } from '../models/goal.model';
import { isReminderOverdue, localDateTimeIso, sortReminders, countPendingReminders } from './reminders';

function reminder(id: string, remindAt: string, done = false): Reminder {
  return { id, title: id, remindAt, done, createdAt: '2026-01-01T00:00:00.000Z' };
}

describe('reminders', () => {
  it('formatea la fecha y hora local como YYYY-MM-DDTHH:mm', () => {
    expect(localDateTimeIso(new Date(2026, 2, 5, 7, 4))).toBe('2026-03-05T07:04');
  });

  it('marca como vencido solo los pendientes cuya fecha ya pasó', () => {
    const now = '2026-03-10T12:00';

    expect(isReminderOverdue(reminder('a', '2026-03-10T11:59'), now)).toBe(true);
    expect(isReminderOverdue(reminder('b', '2026-03-10T12:01'), now)).toBe(false);
    expect(isReminderOverdue(reminder('c', '2026-03-10T11:59', true), now)).toBe(false);
  });

  it('ordena pendientes por fecha y deja los hechos al final', () => {
    const sorted = sortReminders([
      reminder('tarde', '2026-03-12T10:00'),
      reminder('hecho', '2026-03-01T10:00', true),
      reminder('pronto', '2026-03-10T09:00')
    ]);

    expect(sorted.map(item => item.id)).toEqual(['pronto', 'tarde', 'hecho']);
  });

  it('cuenta solo los recordatorios pendientes', () => {
    expect(countPendingReminders([reminder('a', '2026-03-10T09:00'), reminder('b', '2026-03-10T10:00', true)])).toBe(1);
  });
});
