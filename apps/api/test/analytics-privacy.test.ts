import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AnalyticsService, safeProductMetadata } from '../src/modules/analytics/analytics.service';
import type { DatabaseService } from '../src/platform/database/database.service';

test('analytics metadata permits only documented event fields', async () => {
  const privateText = 'INTENTION_AND_SEED_MUST_STAY_PRIVATE';
  assert.deepEqual(safeProductMetadata('solo_session_started', { durationMinutes: 25, intention: privateText, openSeed: privateText }), { durationMinutes: 25 });
  assert.deepEqual(safeProductMetadata('pact_created', { durationMinutes: 9, note: privateText }), {});
  assert.deepEqual(safeProductMetadata('session_checked_out', { outcome: 'progress', note: privateText }), { outcome: 'progress' });
  assert.deepEqual(safeProductMetadata('circle_created', { intention: privateText }), {});

  const writes: unknown[] = [];
  const database = { db: { insert: () => ({ values: async (value: unknown) => { writes.push(value); } }) } } as unknown as DatabaseService;
  const analytics = new AnalyticsService(database);
  await analytics.record('account-id', 'session_checked_out', 'session-id', { outcome: 'stuck', note: privateText });
  assert.equal(writes.length, 1);
  assert.equal(JSON.stringify(writes[0]).includes(privateText), false);
  assert.deepEqual((writes[0] as { metadata: unknown }).metadata, { outcome: 'stuck' });
});
