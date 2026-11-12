const { test } = require('node:test');
const assert = require('node:assert/strict');
const { version, cases } = require('./assistance-eval-cases.cjs');
const { summarize, casebookSha256, checkOutput } = require('./assistance-eval-report.cjs');
test('v1 casebook has frozen IDs, twenty cases per capability and distinct development/holdout sets', () => {
  assert.equal(version, 'assistance-eval-v1'); assert.equal(cases.length, 60);
  assert.equal(casebookSha256, '4eed11a5b465c554a498e0f0b8877e42f24af570a805775affb929837aea750b');
  assert.equal(new Set(cases.map(item => item.id)).size, 60);
  for (const capability of ['assisted_start', 'stuck_recovery', 'open_seed_draft']) {
    const own = cases.filter(item => item.capability === capability);
    assert.equal(own.length, 20); assert.equal(own.filter(item => item.split === 'development').length, 16);
    assert.equal(own.filter(item => item.split === 'holdout').length, 4);
    for (const category of ['clear', 'ambiguous', 'selected_context', 'long_input', 'boundary', 'malformed_output', 'timeout', 'stale_grant'])
      assert.ok(own.some(item => item.category === category), `${capability}: ${category}`);
    assert.ok(own.every(item => item.objective && item.passCondition && item.risk));
  }
});
test('report separates human grading from technical gates and never treats ungraded cases as passes', () => {
  const report = summarize([{ id: cases[0].id, human: 'not_run', schema: 'pass', capability: 'pass', policy: 'pass', authorization: 'pass', manualControl: 'pass' }]);
  assert.equal(report.total.attempted, 1); assert.equal(report.total.humanGraded, 0); assert.equal(report.total.humanRate, null);
  assert.equal(report.content.cases, 48); assert.equal(report.technical.cases, 12);
  assert.equal(report.byCapability.assisted_start.content.cases, 16);
  assert.throws(() => summarize([{ id: 'invented', human: 'pass' }]));
});

test('report requires version manifest and checks saved responses without inference', () => {
  const manifest = { datasetVersion: version, casebookSha256, provider: 'beeknoee', model: 'bee/gpt-6-luna',
    promptRevision: 'pyneath-assistance-v2.1-beeknoee-v1', policyRevision: 'assistance-policy-v1', codeRevision: 'fixture',
    configuration: { responseFormat: 'json_schema', maxTokens: 512, deadlineMs: 12000 }, runAt: '2026-11-13', reviewer: 'fixture' };
  const row = { id: cases[0].id, human: 'not_run', authorization: 'pass', manualControl: 'pass',
    response: { status: 'suggestion', suggestionId: 'f9194eb2-3b02-47da-97fe-9ac81a6095ca',
      output: { capability: 'assisted_start', version: '1', needsHumanSupport: false, activationStep: 'Mở tài liệu giả.', estimatedMinutes: 3, fallback: 'manual_step' } } };
  const report = summarize({ manifest: { ...manifest, configuration: { ...manifest.configuration, apiKey: 'SECRET_MARKER' } },
    results: [{ ...row, prompt: 'SECRET_MARKER' }] });
  assert.equal(report.total.humanGraded, 0); assert.equal(report.cases[0].schema, 'pass');
  assert.equal(JSON.stringify(report).includes('Mở tài liệu giả'), false);
  assert.equal(JSON.stringify(report).includes('SECRET_MARKER'), false);
  assert.throws(() => summarize({ manifest: { ...manifest, casebookSha256: 'changed' }, results: [row] }));
  assert.equal(checkOutput({ ...row, response: { bad: true } }, cases[0]).schema, 'fail');
});
