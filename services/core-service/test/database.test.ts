import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { Database } from '../src/shared/database/database.module';
import { PgAccountRepository } from '../src/identity/infrastructure/pg-account.repository';
import { PgTaskRepository } from '../src/task/infrastructure/pg-task.repository';
import { createTask, archiveTask, updateTask } from '../src/task/domain/task';
import { httpSuite } from './http-suite';

const { initializeDatabase } = require('../../scripts/init-db.cjs') as { initializeDatabase(pool: Pool): Promise<void> };
const testUrl = process.env.TEST_DATABASE_URL;
function testPool() {
  if (!testUrl || !/^btp_test(?:_|$)/.test(new URL(testUrl).pathname.slice(1))) {
    throw new Error('TEST_DATABASE_URL must name a disposable btp_test or btp_test_* database');
  }
  return new Pool({ connectionString: testUrl, connectionTimeoutMillis: 5000, statement_timeout: 5000 });
}
function databaseFor(pool: Pool): Database {
  // Exercise the actual transaction method without reading application database settings.
  return Object.assign(Object.create(Database.prototype) as Database, { pool });
}
const initialized = async (pool: Pool) => {
  try { await initializeDatabase(pool); }
  catch (error) { if ((error as Error).message !== 'REFUSE_EXISTING_SCHEMA') throw error; }
};

httpSuite('PostgreSQL HTTP integration (requires TEST_DATABASE_URL)', async () => {
  const pool = testPool();
  await initialized(pool);
  const database = databaseFor(pool);
  return { database: { pool, transaction: database.transaction.bind(database) } as Database,
    accounts: new PgAccountRepository(database), tasks: new PgTaskRepository(database), cleanup: () => pool.end() };
}, !testUrl);

test('PostgreSQL SQL baseline, constraints, rollback and concurrent archive (requires TEST_DATABASE_URL)', { skip: !testUrl }, async t => {
  const pool = testPool();
  t.after(() => pool.end());
  await initialized(pool);
  await assert.rejects(initializeDatabase(pool), /REFUSE_EXISTING_SCHEMA/);
  const database = databaseFor(pool);
  const accounts = new PgAccountRepository(database);
  const tasks = new PgTaskRepository(database);
  const owner = randomUUID();
  await accounts.create({ id: owner, email: `${owner}@example.test`, passwordHash: 'synthetic-test-hash', enabled: true });
  const task = createTask(owner, 'Atomic action', 5, null);
  await assert.rejects(tasks.createConfirmedAction(task, { taskId: task.id, title: task.title, minutes: 99, confirmedAt: new Date() }));
  assert.equal(await tasks.findForUser(task.id, owner), undefined, 'failed next-action insert must roll back its task');
  await tasks.createConfirmedAction(task, { taskId: task.id, title: task.title, minutes: 5, confirmedAt: new Date() });
  await assert.rejects(pool.query('UPDATE core.tasks SET minutes = 11 WHERE id = $1', [task.id]), { code: '23514' });
  await assert.rejects(pool.query('UPDATE core.tasks SET user_id = $1 WHERE id = $2', [randomUUID(), task.id]), { code: '23503' });
  await assert.rejects(pool.query('UPDATE core.accounts SET email = $1 WHERE id = $2', ['UPPER@example.test', owner]), { code: '23514' });
  const results = await Promise.allSettled([
    tasks.changeForUser(task.id, owner, archiveTask),
    tasks.changeForUser(task.id, owner, current => updateTask(current, { status: 'done' })),
  ]);
  assert.equal(results[0].status, 'fulfilled');
  assert.equal((await tasks.findForUser(task.id, owner))!.status, 'archived');
  const action = await pool.query('SELECT count(*)::int AS count FROM core.next_actions WHERE task_id = $1', [task.id]);
  assert.equal(action.rows[0].count, 1);
});

test('transaction releases its connection and rolls back a downstream failure', async () => {
  const statements: string[] = [];
  let released = false;
  const database = databaseFor({ connect: async () => ({ query: async (sql: string) => { statements.push(sql); }, release: () => { released = true; } }) } as unknown as Pool);
  await assert.rejects(database.transaction(async () => { throw new Error('downstream unavailable'); }), /downstream unavailable/);
  assert.deepEqual(statements, ['BEGIN', 'ROLLBACK']);
  assert.equal(released, true);
});
