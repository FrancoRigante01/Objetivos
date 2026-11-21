import { Component, ElementRef, HostListener, computed, inject, output, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';

import { GoalStore } from '../../../core/data/goal.store';
import { SearchResult, searchGoals } from '../../../core/utils/search';

@Component({
  selector: 'app-global-search',
  templateUrl: './global-search.component.html'
})
export class GlobalSearchComponent {
  private readonly store = inject(GoalStore);
  private readonly router = inject(Router);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly listbox = viewChild<ElementRef<HTMLElement>>('listbox');

  readonly navigate = output<void>();

  protected readonly query = signal('');
  protected readonly activeIndex = signal(0);
  protected readonly results = computed(() => searchGoals(this.store.goals(), this.store.lists(), this.query()));

  @HostListener('document:keydown', ['$event'])
  protected onDocumentKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.openSearch();
    }
  }

  protected openSearch(): void {
    const dialog = this.dialog().nativeElement;
    if (dialog.open) {
      return;
    }
    this.query.set('');
    this.activeIndex.set(0);
    dialog.showModal();
  }

  protected close(): void {
    this.dialog().nativeElement.close();
  }

  protected updateQuery(value: string): void {
    this.query.set(value);
    this.activeIndex.set(0);
  }

  protected onInputKeydown(event: KeyboardEvent): void {
    const count = this.results().length;
    if (count === 0) {
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.moveTo((this.activeIndex() + 1) % count);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.moveTo((this.activeIndex() - 1 + count) % count);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.select(this.results()[this.activeIndex()]);
    }
  }

  protected select(result: SearchResult): void {
    this.close();
    this.navigate.emit();
    this.router.navigate(['/listas', result.goal.listId], { queryParams: { resaltar: result.goal.id } });
  }

  protected primaryText(result: SearchResult): string {
    return result.type === 'goal' ? result.goal.title : result.subtask.title;
  }

  protected secondaryText(result: SearchResult): string {
    if (result.type === 'goal') {
      return result.listName;
    }
    return [result.listName, result.goal.title, ...result.path].join(' › ');
  }

  private moveTo(index: number): void {
    this.activeIndex.set(index);
    this.listbox()?.nativeElement.children[index]?.scrollIntoView({ block: 'nearest' });
  }
}
