import { AppData, APP_DATA_VERSION, GoalRepository } from '../core/data/goal.repository';

export class InMemoryGoalRepository extends GoalRepository {
  data: AppData = { version: APP_DATA_VERSION, lists: [], goals: [] };

  load(): AppData {
    return structuredClone(this.data);
  }

  save(data: AppData): void {
    this.data = structuredClone(data);
  }
}
