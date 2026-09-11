import type { ConfirmedAction, Task, TaskStatus } from '../domain/task';

export abstract class TaskRepository {
  abstract createConfirmedAction(task: Task, action: ConfirmedAction): Promise<void>;
  abstract findForUser(id: string, userId: string): Promise<Task | undefined>;
  abstract listForUser(userId: string, status: TaskStatus | undefined, limit: number): Promise<Task[]>;
  // Lock and read the current owned row before applying the domain transition.
  abstract changeForUser(id: string, userId: string, change: (task: Task) => Task): Promise<Task>;
}
