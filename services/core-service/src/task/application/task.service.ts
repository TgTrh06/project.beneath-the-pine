import { AppError } from '../../shared/error/app-error';
import { archiveTask, createTask, updateTask, TaskStatus, TaskUpdate } from '../domain/task';
import { TaskRepository } from './task.repository';

export class TaskService {
  constructor(private readonly tasks: TaskRepository) {}
  async create(userId: string, input: { title: string; minutes: number; sourceBrainDumpId?: string | null }) {
    const task = createTask(userId, input.title, input.minutes, input.sourceBrainDumpId ?? null);
    const nextAction = { taskId: task.id, title: task.title, minutes: task.minutes, confirmedAt: task.createdAt };
    await this.tasks.createConfirmedAction(task, nextAction);
    return { task, nextAction };
  }
  async get(userId: string, id: string) {
    const task = await this.tasks.findForUser(id, userId);
    if (!task) throw new AppError('TASK_NOT_FOUND', 'Task was not found', 404);
    return task;
  }
  async list(userId: string, status: TaskStatus | undefined, limit: number) {
    return { tasks: await this.tasks.listForUser(userId, status, limit) };
  }
  update(userId: string, id: string, input: TaskUpdate) {
    return this.tasks.changeForUser(id, userId, task => updateTask(task, input));
  }
  archive(userId: string, id: string) {
    return this.tasks.changeForUser(id, userId, task => archiveTask(task));
  }
}
