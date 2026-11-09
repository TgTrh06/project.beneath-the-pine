import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Subject } from 'rxjs';
import { PreferencesService } from '../src/modules/preferences/application/preferences.service';
import type { PreferencesRepository } from '../src/modules/preferences/application/preferences.ports';
import type { TransactionContext, UnitOfWork } from '../src/shared/kernel/unit-of-work';
import type { PreferencesRecord } from '../src/modules/preferences/domain/preferences';

test('preference updates preserve omitted values and publish sharing changes only after persistence', async () => {
  const now = new Date('2026-11-08T00:00:00Z'), order: string[] = [];
  const row: PreferencesRecord = { accountId: 'owner', sharePresence: true, remindAcceptedPacts: true, presetDurationMinutes: 25, presetSoundscapeId: 'rain', forestLayout: 'arc', forestHidden: [1], forestVersion: 2, updatedAt: now };
  let fail = true;
  const repository: PreferencesRepository = {
    get: async () => row, lockReminders: async () => true, arrange: async () => row,
    save: async (_accountId, patch, date) => {
      assert.deepEqual(patch, { sharePresence: false }); assert.equal(date, now);
      if (fail) throw new Error('fixture persistence failure');
      order.push('persisted'); return { ...row, ...patch };
    },
  };
  const changes = new Subject<string>(); changes.subscribe(id => { assert.equal(id, 'owner'); order.push('notified'); });
  const transactions: UnitOfWork = { run: async work => work({} as TransactionContext) };
  const service = new PreferencesService(repository, transactions, { lock: async () => true }, { earnedThresholds: async () => [1] }, { now: () => now }, changes);
  await assert.rejects(service.update('owner', { sharePresence: false }), /fixture persistence/);
  assert.deepEqual(order, []);
  fail = false;
  const saved = await service.update('owner', { sharePresence: false });
  assert.deepEqual(order, ['persisted', 'notified']);
  assert.equal(saved.remindAcceptedPacts, true);
  assert.deepEqual(saved.focusPreset, { durationMinutes: 25, soundscapeId: 'rain' });
  assert.deepEqual(saved.forestArrangement, { layout: 'arc', hidden: [1], version: 2 });
});
