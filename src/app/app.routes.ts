import { Routes } from '@angular/router';

import { RemindersViewComponent } from './features/reminders/reminders-view/reminders-view.component';
import { TaskViewComponent } from './features/tasks/task-view/task-view.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'mi-dia' },
  { path: 'mi-dia', component: TaskViewComponent, data: { smartList: 'myDay' } },
  { path: 'importantes', component: TaskViewComponent, data: { smartList: 'important' } },
  { path: 'planificadas', component: TaskViewComponent, data: { smartList: 'planned' } },
  { path: 'completadas', component: TaskViewComponent, data: { smartList: 'completed' } },
  { path: 'recordatorios', component: RemindersViewComponent },
  { path: 'listas/:listId', component: TaskViewComponent },
  { path: '**', redirectTo: 'mi-dia' }
];
