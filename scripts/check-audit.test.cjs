const { test } = require('node:test');
const assert = require('node:assert/strict');
const { checkAudit } = require('./check-audit.cjs');
const [exception] = require('./audit-exceptions.json');
const report = () => ({ metadata: { vulnerabilities: { moderate: 1 } }, advisories: { one: {
  github_advisory_id: exception.id, module_name: exception.package, severity: exception.severity,
  findings: [{ version: exception.version, paths: [exception.path] }],
} } });
test('audit exceptions match exact advisory, version, path, severity and expiry', () => {
  const date = new Date('2026-11-02T00:00:00Z');
  assert.equal(checkAudit(report(), [exception], date).accepted.length, 1);
  for (const changed of [{ path: 'different>dependency' }, { version: '0.18.19' }, { severity: 'high' }, { id: 'other-advisory' }]) {
    assert.equal(checkAudit(report(), [{ ...exception, ...changed }], date).unknown.length, 1);
  }
  assert.equal(checkAudit(report(), [exception], new Date('2026-12-03')).unknown.length, 1);
  const extra = report(); extra.advisories.one.findings[0].paths.push('new>exposure');
  assert.equal(checkAudit(extra, [exception], date).unknown.length, 1);
});
test('audit fails closed on registry errors and malformed or missing findings', () => {
  for (const value of [null, {}, { error: 'registry down' }, { metadata: { vulnerabilities: { high: 1 } }, advisories: {} }]) {
    assert.throws(() => checkAudit(value));
  }
});
