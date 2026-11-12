const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { TrialBudget, reserveCost, MODELS } = require('./beeknoee-budget.cjs');
function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pyneath-bee-test-'));
  const file = path.join(dir, 'ledger.json');
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return file;
}
const attempt = (caseId, extra = {}) => ({ model: MODELS[0], phase: 'evaluation', caseId, reservedVND: 5, ...extra });
test('reserve is durable before network, locks concurrent runs, and blocks after an unresolved failure/restart', t => {
  const file = fixture(t), first = new TrialBudget(file);
  first.reserve(attempt('one'));
  assert.throws(() => new TrialBudget(file), /EEXIST/);
  first.close();
  const resumed = new TrialBudget(file);
  assert.equal(resumed.total(), 5); assert.equal(resumed.data.attempts.length, 1);
  assert.throws(() => resumed.reserve(attempt('two')), /Unreconciled/);
  assert.throws(() => resumed.settle(1, undefined), /Unknown cost/);
  resumed.settle(1, 2, { status: 'provider_error' });
  assert.equal(resumed.total(), 2);
  assert.throws(() => resumed.reserve(attempt('one')), /already attempted/);
  resumed.close();
});
test('spend ceilings, phase limits and model allowlist fail closed', t => {
  const ledger = new TrialBudget(fixture(t));
  assert.throws(() => ledger.reserve(attempt('x', { model: 'another-model' })), /Unapproved/);
  assert.throws(() => ledger.reserve(attempt('x', { reservedVND: 1376 })), /spend/);
  ledger.reserve(attempt('first', { reservedVND: 1370 })); ledger.settle(1, 1370);
  assert.throws(() => ledger.reserve(attempt('next', { reservedVND: 6 })), /spend/); ledger.close();
  const file = path.join(path.dirname(fixture(t)), 'phases.json'), phases = new TrialBudget(file);
  for (let i = 0; i < 3; i++) { phases.reserve(attempt('probe' + i, { phase: 'compatibility' })); phases.settle(i + 1, 1); }
  assert.throws(() => phases.reserve(attempt('probe4', { phase: 'compatibility' })), /compatibility limit/);
  phases.close();
});
test('all thirty calls include failed attempts and the cap survives restart', t => {
  const file = fixture(t); let ledger = new TrialBudget(file);
  for (const phase of ['compatibility', 'evaluation', 'ui', 'reserve']) {
    const count = { compatibility: 6, evaluation: 18, ui: 3, reserve: 3 }[phase];
    for (let i = 0; i < count; i++) {
      const row = ledger.reserve(attempt(phase + i, { phase, model: MODELS[i % 2] }));
      ledger.settle(row.attempt, 1, { status: 'failed' });
    }
  }
  ledger.close(); ledger = new TrialBudget(file);
  assert.equal(ledger.data.attempts.length, 30);
  assert.throws(() => ledger.reserve(attempt('overflow', { phase: 'reserve' })), /call limit/); ledger.close();
});
test('reservation uses undiscounted bytes, output ceiling and surcharge; rejects unknown billing', () => {
  const payload = { model: MODELS[0], max_tokens: 512, stream: false, messages: [{ role: 'user', content: 'Viết một câu.' }] };
  const pricing = { currency: 'USD', unit: 'per_1M_tokens', input: 0.1, output: 0.5, reasoning: null };
  assert.ok(reserveCost(payload, pricing) >= 12);
  assert.throws(() => reserveCost({ ...payload, max_tokens: 1024 }, pricing), /Unbounded/);
  assert.throws(() => reserveCost(payload, { ...pricing, unit: 'request' }), /Unverified/);
  assert.throws(() => reserveCost(payload, { ...pricing, reasoning: 1 }), /reasoning/);
  assert.ok(reserveCost(payload, { ...pricing, cache_write: 2 }) > reserveCost(payload, pricing));
  assert.ok(reserveCost({ ...payload, messages: [{ content: 'ữ'.repeat(4000) }] }, pricing) > reserveCost(payload, pricing));
});
