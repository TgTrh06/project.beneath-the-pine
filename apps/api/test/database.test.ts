import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'node:net';
import { DatabaseService } from '../src/platform/database/database.service';
import { readApiConfig } from '../src/platform/config/api-config';

test('no database configuration makes no connection and reports unavailable', async () => {
  const database = new DatabaseService(readApiConfig({}));
  assert.equal(await database.isReachable(), false);
  assert.throws(() => database.db, /not configured/);
  await database.onApplicationShutdown();
});

test('an unavailable PostgreSQL driver fails within the configured timeout and closes cleanly', async t => {
  // An isolated TCP endpoint deliberately never speaks PostgreSQL; no real DB is contacted.
  const sockets = new Set<import('node:net').Socket>();
  const server = createServer(socket => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
    socket.on('error', () => {});
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    for (const socket of sockets) socket.destroy();
    await new Promise<void>(resolve => server.close(() => resolve()));
  });
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const database = new DatabaseService(readApiConfig({ API_DATABASE_URL: `postgresql://test:test@127.0.0.1:${address.port}/test`, API_DB_TIMEOUT_MS: '100' }));
  t.after(() => database.onApplicationShutdown());
  const started = Date.now();
  assert.equal(await database.isReachable(), false);
  assert.ok(Date.now() - started < 3000);
});
