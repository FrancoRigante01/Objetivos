import { Injectable } from '@angular/core';

import { APP_DATA_VERSION, AppData, parseAppData } from './app-data';

export { APP_DATA_VERSION, type AppData } from './app-data';

export abstract class GoalRepository {
  abstract load(): AppData;
  abstract save(data: AppData): void;
}

const STORAGE_KEY = 'objetivos:data';

function emptyData(): AppData {
  return { version: APP_DATA_VERSION, lists: [], goals: [], reminders: [] };
}

@Injectable()
export class LocalStorageGoalRepository extends GoalRepository {
  load(): AppData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? parseAppData(raw) : emptyData();
    } catch {
      return emptyData();
    }
  }

  save(data: AppData): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}
