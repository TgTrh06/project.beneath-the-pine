import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Database } from '../../shared/database/database.module';
import { AppError } from '../../shared/error/app-error';
import { TaskRepository } from '../application/task.repository';
import { ConfirmedAction, Task, TaskStatus } from '../domain/task';

const columns = `id, user_id AS "userId", title, minutes, status, source_brain_dump_id AS "sourceBrainDumpId",
  created_at AS "createdAt", updated_at AS "updatedAt"`;

@Injectable()
export class PgTaskRepository extends TaskRepository {
  constructor(private readonly database: Database) { super(); }
  async createConfirmedAction(task: Task, action: ConfirmedAction): Promise<void> {
    await this.database.transaction(async client => {
      await client.query(`INSERT INTO core.tasks
        (id, user_id, title, minutes, status, source_brain_dump_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [task.id, task.userId, task.title, task.minutes, task.status, task.sourceBrainDumpId, task.createdAt, task.updatedAt]);
      await client.query(`INSERT INTO core.next_actions (id, task_id, title, minutes, confirmed_at) VALUES ($1, $2, $3, $4, $5)`,
        [randomUUID(), action.taskId, action.title, action.minutes, action.confirmedAt]);
    });
  }
  async findForUser(id: string, userId: string): Promise<Task | undefined> {
    return (await this.database.pool.query<Task>(`SELECT ${columns} FROM core.tasks WHERE id = $1 AND user_id = $2`, [id, userId])).rows[0];
  }
  async listForUser(userId: string, status: TaskStatus | undefined, limit: number): Promise<Task[]> {
    return (await this.database.pool.query<Task>(`SELECT ${columns} FROM core.tasks
      WHERE user_id = $1 AND ($2::text IS NULL OR status = $2) ORDER BY created_at DESC, id DESC LIMIT $3`,
    [userId, status ?? null, limit])).rows;
  }
  async changeForUser(id: string, userId: string, change: (task: Task) => Task): Promise<Task> {
    return this.database.transaction(async client => {
      const current = (await client.query<Task>(`SELECT ${columns} FROM core.tasks WHERE id = $1 AND user_id = $2 FOR UPDATE`, [id, userId])).rows[0];
      if (!current) throw new AppError('TASK_NOT_FOUND', 'Task was not found', 404);
      const task = change(current);
      return (await client.query<Task>(`UPDATE core.tasks SET title = $3, minutes = $4, status = $5, updated_at = $6
        WHERE id = $1 AND user_id = $2 RETURNING ${columns}`, [id, userId, task.title, task.minutes, task.status, task.updatedAt])).rows[0];
    });
  }
}
