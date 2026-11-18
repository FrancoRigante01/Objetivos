import { Component, inject, signal, viewChild, ElementRef } from '@angular/core';

import { APP_DATA_VERSION, parseAppData, serializeAppData } from '../../core/data/app-data';
import { downloadTextFile } from '../../core/data/data-transfer';
import { GoalStore } from '../../core/data/goal.store';
import { todayIso } from '../../core/utils/goal-progress';

interface StatusMessage {
  type: 'success' | 'error';
  text: string;
}

@Component({
  selector: 'app-data-transfer',
  templateUrl: './data-transfer.component.html'
})
export class DataTransferComponent {
  private readonly store = inject(GoalStore);
  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  protected readonly status = signal<StatusMessage | null>(null);

  protected exportData(): void {
    const json = serializeAppData({
      version: APP_DATA_VERSION,
      lists: [...this.store.lists()],
      goals: [...this.store.goals()]
    });
    downloadTextFile(`objetivos-${todayIso()}.json`, json);
    this.status.set({ type: 'success', text: 'Copia exportada.' });
  }

  protected chooseFile(): void {
    this.fileInput().nativeElement.click();
  }

  protected async importFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }

    try {
      const data = parseAppData(await file.text());
      if (!window.confirm('Esto reemplazará todos tus datos actuales. ¿Quieres continuar?')) {
        return;
      }
      this.store.replaceAll(data);
      this.status.set({ type: 'success', text: 'Datos importados correctamente.' });
    } catch (error) {
      const text = error instanceof Error ? error.message : 'No se pudo importar el archivo.';
      this.status.set({ type: 'error', text });
    }
  }
}
