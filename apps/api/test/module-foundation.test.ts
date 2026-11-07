import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BusinessError } from '../src/shared/kernel/business-error';
import type { TransactionContext, TransactionOptions } from '../src/shared/kernel/unit-of-work';
import { PostgresUnitOfWork } from '../src/platform/database/postgres-unit-of-work';
import type { DatabaseService } from '../src/platform/database/database.service';
import { ProfileService } from '../src/modules/profile/application/profile.service';
import { AnalyticsService } from '../src/modules/analytics/application/analytics.service';
import type { AnalyticsRepository } from '../src/modules/analytics/application/analytics.ports';
import { ApiErrorFilter } from '../src/platform/http/api-error.filter';
import type { ArgumentsHost } from '@nestjs/common';

test('unit of work scopes contexts to the owning transaction and invalidates them after success or failure', async () => {
  const connection = {};
  const database = { db: { transaction: async (work: (value: object) => Promise<unknown>) => work(connection) } } as unknown as DatabaseService;
  const transactions = new PostgresUnitOfWork(database), other = new PostgresUnitOfWork(database);
  let saved: TransactionContext | undefined;
  await transactions.run(async context => {
    saved = context;
    assert.equal(transactions.reader(context), connection);
    assert.throws(() => other.reader(context));
  });
  assert.throws(() => transactions.reader(saved));
  await assert.rejects(transactions.run(async context => { saved = context; throw new Error('fixture rollback'); }));
  assert.throws(() => transactions.reader(saved));
  assert.equal(transactions.reader(), database.db);
});

test('profile use case preserves patch defaults and rejects invalid timezone before repository access', async () => {
  const now = new Date('2026-11-07T00:00:00Z');
  let reads = 0;
  const profile = new ProfileService({ get: async () => { reads++; return { accountId: 'owner', displayName: 'Name', timezone: 'Asia/Saigon', updatedAt: now }; }, save: async value => value }, { now: () => now });
  await assert.rejects(profile.update('owner', { timezone: 'not-a-timezone' }), error => error instanceof BusinessError && error.code === 'VALIDATION_FAILED');
  assert.equal(reads, 0);
  assert.deepEqual(await profile.update('owner', { displayName: null }), { accountId: 'owner', displayName: null, timezone: 'Asia/Saigon', updatedAt: now });
});

test('unit of work preserves explicit isolation and leaves the default transaction configuration unchanged', async () => {
  const configurations: Array<TransactionOptions | undefined> = [];
  const database = { db: { transaction: async (work: (connection: object) => Promise<unknown>, options?: TransactionOptions) => {
    configurations.push(options);
    return work({});
  } } } as unknown as DatabaseService;
  const transactions = new PostgresUnitOfWork(database);
  await transactions.run(async () => undefined);
  await transactions.run(async () => undefined, { isolationLevel: 'repeatable read' });
  assert.deepEqual(configurations, [undefined, { isolationLevel: 'repeatable read' }]);
});

test('quota policy passes the same context through lock, UTC counts and reservation', async () => {
  const context = {} as TransactionContext, calls: string[] = [];
  const repository: AnalyticsRepository = {
    append: async (event, tx) => { assert.equal(tx, context); assert.deepEqual(event.metadata, { capability: 'stuck_recovery' }); calls.push('append'); },
    lockAssistanceQuota: async tx => { assert.equal(tx, context); calls.push('lock'); },
    countRequests: async (start, end, tx, owner) => {
      assert.equal(tx, context); assert.equal(start.toISOString(), '2026-11-07T00:00:00.000Z'); assert.equal(end.toISOString(), '2026-11-08T00:00:00.000Z'); calls.push(owner ? 'account' : 'global'); return 0;
    }, ownsRequest: async () => false,
  };
  const service = new AnalyticsService(repository, { run: work => work(context) }, { now: () => new Date('2026-11-07T12:34:00Z') }, () => 'fixture-id');
  assert.equal(await service.reserveAssistanceRequest('owner', 'stuck_recovery'), 'fixture-id');
  assert.deepEqual(calls, ['lock', 'global', 'account', 'append']);
});

test('business errors retain the existing public HTTP error envelope', () => {
  let result: unknown, status: number | undefined;
  const response = { getHeader: () => 'request-id', status: (value: number) => { status = value; return response; }, json: (value: unknown) => { result = value; } };
  const host = { switchToHttp: () => ({ getResponse: () => response }) } as unknown as ArgumentsHost;
  new ApiErrorFilter().catch(new BusinessError('NOT_FOUND'), host);
  assert.equal(status, 404);
  assert.deepEqual(result, { code: 'NOT_FOUND', message: 'The route was not found.', requestId: 'request-id', details: [] });
});
