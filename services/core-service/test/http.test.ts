import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Test } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';
import { readConfig } from '../src/shared/config';
import { Database } from '../src/shared/database/database.module';
import { AppError } from '../src/shared/error/app-error';
import { Account, AccountRepository } from '../src/identity/application/account.repository';
import { TaskRepository } from '../src/task/application/task.repository';
import type { ConfirmedAction, Task, TaskStatus } from '../src/task/domain/task';
import { assertExpiredSession, httpSuite } from './http-suite';

class MemoryAccounts extends AccountRepository {
  accounts = new Map<string, Account>();
  async findByEmail(email: string) { return this.accounts.get(email); }
  async create(account: Account) {
    if (this.accounts.has(account.email)) throw new AppError('ACCOUNT_ALREADY_EXISTS', 'An account with this email already exists.', 409);
    this.accounts.set(account.email, account);
  }
}
class MemoryTasks extends TaskRepository {
  tasks = new Map<string, Task>();
  async createConfirmedAction(task: Task, _action: ConfirmedAction) { this.tasks.set(task.id, task); }
  async findForUser(id: string, userId: string) { const task = this.tasks.get(id); return task?.userId === userId ? task : undefined; }
  async listForUser(userId: string, status: TaskStatus | undefined, limit: number) {
    return [...this.tasks.values()].filter(task => task.userId === userId && (!status || task.status === status)).slice(0, limit);
  }
  async changeForUser(id: string, userId: string, change: (task: Task) => Task) {
    const current = await this.findForUser(id, userId);
    if (!current) throw new AppError('TASK_NOT_FOUND', 'Task was not found', 404);
    const task = change(current);
    this.tasks.set(id, task);
    return task;
  }
}

httpSuite('HTTP, session security and task behavior (in-memory repository ports)', async () => ({
  database: { pool: { query: async () => ({ rows: [] }) } } as unknown as Database,
  accounts: new MemoryAccounts(), tasks: new MemoryTasks(), cleanup: async () => {},
}));

test('database failures stay private; readiness fails while liveness stays up; CSRF expires', async t => {
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(Database).useValue({ pool: { query: async () => { throw new Error('postgres://private-secret@host/db'); } } })
    .compile();
  const app = module.createNestApplication<NestExpressApplication>({ bodyParser: false, logger: false });
  configureApp(app, readConfig({ NODE_ENV: 'test', SESSION_TIMEOUT: '1s' }));
  await app.init();
  t.after(() => app.close());
  const server = app.getHttpServer();
  await request(server).get('/actuator/health/liveness').expect(200);
  const notReady = await request(server).get('/actuator/health/readiness').expect(503);
  assert.equal(notReady.body.code, 'SERVICE_UNAVAILABLE');
  assert.ok(!JSON.stringify(notReady.body).includes('private-secret'));
  const agent = request.agent(server);
  const token = (await agent.get('/api/v1/auth/session')).body.csrfToken;
  const failed = await agent.post('/api/v1/auth/login').set('X-XSRF-TOKEN', token)
    .send({ email: 'valid@example.test', password: 'a-secure-passphrase' }).expect(500);
  assert.equal(failed.body.code, 'INTERNAL_ERROR');
  assert.ok(!JSON.stringify(failed.body).includes('private-secret'));
  await assertExpiredSession(app);
});
