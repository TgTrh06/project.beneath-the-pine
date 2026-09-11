import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createTask, updateTask, archiveTask } from '../src/task/domain/task';
import { readConfig } from '../src/shared/config';
import { AppError } from '../src/shared/error/app-error';
import { IdentityService } from '../src/identity/application/identity.service';
import { hash } from 'bcryptjs';

test('domain enforces input and immutable archive independently of HTTP', () => {
  for (const minutes of [0, 11, 1.5, NaN]) assert.throws(() => createTask('owner', 'Valid task', minutes, null), AppError);
  assert.throws(() => createTask('owner', '   ', 1, null), AppError);
  const task = createTask('owner', '  Open notebook ', 5, null);
  assert.equal(task.title, 'Open notebook');
  const changed = updateTask(task, { status: 'done', minutes: 2 });
  assert.equal(task.status, 'ready');
  assert.equal(changed.status, 'done');
  const archived = archiveTask(changed);
  assert.throws(() => updateTask(archived, { title: 'New title' }), { code: 'TASK_ARCHIVED' });
  assert.throws(() => archiveTask(archived), { code: 'TASK_ARCHIVED' });
});

test('configuration rejects invalid URL, unsafe cookies, excessive timeout and unsupported production sessions', () => {
  for (const env of [{ DATABASE_URL: 'jdbc:postgresql://localhost/db' }, { SESSION_COOKIE_SAME_SITE: 'none' },
    { SESSION_SECRET: 'short' }, { SESSION_TIMEOUT: '100h' }, { WEB_ORIGIN: 'https://example.test/path' }, { NODE_ENV: 'production' }]) {
    assert.throws(() => readConfig(env));
  }
  assert.equal(readConfig({ SESSION_TIMEOUT: '2h' }).sessionMaxAge, 7_200_000);
});

test('disabled accounts cannot log in even with the correct BCrypt password', async () => {
  const service = new IdentityService({
    findByEmail: async () => ({ id: 'disabled', email: 'disabled@example.test', enabled: false, passwordHash: await hash('a-secure-passphrase', 12) }),
    create: async () => {},
  });
  await assert.rejects(service.login('disabled@example.test', 'a-secure-passphrase'), { code: 'INVALID_CREDENTIALS' });
});
