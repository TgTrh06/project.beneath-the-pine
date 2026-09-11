import { randomUUID } from 'node:crypto';
import { AppError } from '../../shared/error/app-error';

export type TaskStatus = 'ready' | 'done' | 'deferred' | 'archived';
export type Task = {
  id: string; userId: string; title: string; minutes: number; status: TaskStatus;
  sourceBrainDumpId: string | null; createdAt: Date; updatedAt: Date;
};
export type TaskUpdate = { title?: string | null; minutes?: number | null; status?: Exclude<TaskStatus, 'archived'> | null };
export type ConfirmedAction = { taskId: string; title: string; minutes: number; confirmedAt: Date };

function normalizeTitle(title: string): string {
  const normalized = title.trim();
  if (normalized.length < 2 || normalized.length > 280) {
    throw new AppError('INVALID_TASK', 'Task title must contain between 2 and 280 characters', 400);
  }
  return normalized;
}
function validMinutes(minutes: number): number {
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 10) {
    throw new AppError('INVALID_TASK', 'Task minutes must be between 1 and 10', 400);
  }
  return minutes;
}
function ensureMutable(task: Task): void {
  if (task.status === 'archived') throw new AppError('TASK_ARCHIVED', 'An archived task cannot be changed', 409);
}

export function createTask(userId: string, title: string, minutes: number, sourceBrainDumpId: string | null, now = new Date()): Task {
  return { id: randomUUID(), userId, title: normalizeTitle(title), minutes: validMinutes(minutes), status: 'ready', sourceBrainDumpId, createdAt: now, updatedAt: now };
}

export function updateTask(task: Task, input: TaskUpdate, now = new Date()): Task {
  ensureMutable(task);
  if (input.title == null && input.minutes == null && input.status == null) {
    throw new AppError('INVALID_TASK', 'At least one task field must be provided', 400);
  }
  if (input.status != null && !['ready', 'done', 'deferred'].includes(input.status)) {
    throw new AppError('INVALID_TASK', 'Use the archive operation to archive a task', 400);
  }
  return { ...task, title: input.title == null ? task.title : normalizeTitle(input.title),
    minutes: input.minutes == null ? task.minutes : validMinutes(input.minutes), status: input.status ?? task.status, updatedAt: now };
}

export function archiveTask(task: Task, now = new Date()): Task {
  ensureMutable(task);
  return { ...task, status: 'archived', updatedAt: now };
}
