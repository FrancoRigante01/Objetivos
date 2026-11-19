import { Reminder } from '../models/goal.model';
import { todayIso } from './goal-progress';

export function localDateTimeIso(now: Date = new Date()): string {
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${todayIso(now)}T${hours}:${minutes}`;
}

export function isReminderOverdue(reminder: Reminder, now: string): boolean {
  return !reminder.done && reminder.remindAt < now;
}

export function sortReminders(reminders: Reminder[]): Reminder[] {
  return [...reminders].sort((a, b) => {
    if (a.done !== b.done) {
      return a.done ? 1 : -1;
    }
    return a.remindAt.localeCompare(b.remindAt);
  });
}

export function countPendingReminders(reminders: Reminder[]): number {
  return reminders.filter(reminder => !reminder.done).length;
}
