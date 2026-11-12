const { test } = require('node:test');
const assert = require('node:assert/strict');
const { matchUsage } = require('./beeknoee-run.cjs');
test('usage reconciles catalog display names or IDs, never assumes missing/error cost is free', () => {
  const row = { model: 'bee/gpt-6-luna', modelName: 'GPT-6 Luna', started: '2026-11-13T00:00:00Z' };
  const entry = { id: 'new', model: row.modelName, date: '2026-11-13T00:00:01Z', costVND: 1.11 };
  assert.equal(matchUsage([entry], row, []).costVND, 1.11);
  assert.equal(matchUsage([{ ...entry, model: row.model }], row, []).costVND, 1.11);
  assert.equal(matchUsage([entry], row, ['new']), null);
  assert.throws(() => matchUsage([entry, { ...entry, id: 'another' }], row, []), /Concurrent/);
  assert.throws(() => matchUsage([{ ...entry, model: 'another model' }], row, []), /Concurrent/);
  assert.throws(() => matchUsage([{ ...entry, costVND: null }], row, []), /Unrecognized/);
  assert.throws(() => matchUsage([{ ...entry, costVND: -1 }], row, []), /Unrecognized/);
  assert.throws(() => matchUsage([{ ...entry, date: '2020-01-01' }], row, []), /Unrecognized/);
  assert.equal(matchUsage([{ ...entry, costVND: 0 }], row, []).costVND, 0);
});
