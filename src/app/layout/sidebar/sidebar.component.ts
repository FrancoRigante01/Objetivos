import { Component, computed, inject, output, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { GoalStore } from '../../core/data/goal.store';
import { todayIso } from '../../core/utils/goal-progress';
import { countPendingReminders } from '../../core/utils/reminders';
import { countSmartList, SMART_LISTS, SmartListKey } from '../../core/utils/smart-lists';
import { DataTransferComponent } from '../../features/data-transfer/data-transfer.component';
import { ListNameFormComponent } from '../../features/lists/list-name-form/list-name-form.component';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, ListNameFormComponent, DataTransferComponent],
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent {
  private readonly store = inject(GoalStore);
  private readonly router = inject(Router);

  readonly navigate = output<void>();

  protected readonly smartLists = SMART_LISTS;
  protected readonly lists = this.store.lists;
  protected readonly creatingList = signal(false);
  protected readonly pendingReminders = computed(() => countPendingReminders(this.store.reminders()));

  protected smartListCount(key: SmartListKey): number {
    return countSmartList(this.store.goals(), key, todayIso());
  }

  protected pendingCount(listId: string): number {
    return this.store.goals().filter(goal => goal.listId === listId && !goal.completed).length;
  }

  protected createList(name: string): void {
    const list = this.store.addList(name);
    this.creatingList.set(false);
    this.router.navigate(['/listas', list.id]);
    this.navigate.emit();
  }
}
