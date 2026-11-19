import { Component, computed, inject, signal } from '@angular/core';

import { GoalStore } from '../../../core/data/goal.store';
import { Reminder, ReminderDraft } from '../../../core/models/goal.model';
import { isReminderOverdue, localDateTimeIso, sortReminders, countPendingReminders } from '../../../core/utils/reminders';
import { ReminderFormComponent } from '../reminder-form/reminder-form.component';

@Component({
  selector: 'app-reminders-view',
  imports: [ReminderFormComponent],
  templateUrl: './reminders-view.component.html'
})
export class RemindersViewComponent {
  protected readonly store = inject(GoalStore);

  protected readonly now = localDateTimeIso();

  protected readonly creating = signal(false);
  protected readonly editingReminderId = signal<string | null>(null);

  protected readonly reminders = computed(() => sortReminders(this.store.reminders()));
  protected readonly pendingCount = computed(() => countPendingReminders(this.store.reminders()));

  protected isOverdue(reminder: Reminder): boolean {
    return isReminderOverdue(reminder, this.now);
  }

  protected formatRemindAt(remindAt: string): string {
    const [date, time] = remindAt.split('T');
    const [year, month, day] = date.split('-').map(Number);
    const formattedDate = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric' }).format(
      new Date(year, month - 1, day)
    );
    return `${formattedDate}, ${time}`;
  }

  protected startCreate(): void {
    this.editingReminderId.set(null);
    this.creating.set(true);
  }

  protected startEdit(reminder: Reminder): void {
    this.creating.set(false);
    this.editingReminderId.set(reminder.id);
  }

  protected cancelForm(): void {
    this.creating.set(false);
    this.editingReminderId.set(null);
  }

  protected createReminder(draft: ReminderDraft): void {
    this.store.addReminder(draft);
    this.creating.set(false);
  }

  protected updateReminder(reminder: Reminder, draft: ReminderDraft): void {
    this.store.updateReminder(reminder.id, draft);
    this.editingReminderId.set(null);
  }

  protected deleteReminder(reminder: Reminder): void {
    if (window.confirm(`¿Eliminar el recordatorio "${reminder.title}"?`)) {
      this.store.removeReminder(reminder.id);
    }
  }
}
