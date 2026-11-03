const { spawnSync } = require('node:child_process');
const exceptions = require('./audit-exceptions.json');

function checkAudit(report, allowances = exceptions, now = new Date()) {
  if (!report || report.error || !report.advisories || !report.metadata?.vulnerabilities) throw new Error('Audit response is unavailable or malformed');
  const unknown = [], accepted = [];
  for (const advisory of Object.values(report.advisories)) {
    if (!advisory.github_advisory_id || !Array.isArray(advisory.findings) || !advisory.findings.length) throw new Error('Audit finding has no identity or dependency path');
    for (const finding of advisory.findings) {
      if (!Array.isArray(finding.paths) || !finding.paths.length) throw new Error('Audit finding has no dependency path');
      for (const path of finding.paths) {
        const item = { id: advisory.github_advisory_id, package: advisory.module_name, version: finding.version, severity: advisory.severity, path };
        const approved = allowances.find(value => Object.keys(item).every(key => value[key] === item[key])
          && Date.parse(value.expires + 'T23:59:59Z') >= now.getTime()
          && value.exploitConditions && value.reason && value.mitigation && value.removeWhen && value.owner && value.scope === 'development');
        (approved ? accepted : unknown).push(item);
      }
    }
  }
  const count = Object.values(report.metadata.vulnerabilities).reduce((sum, value) => sum + Number(value), 0);
  if (!Number.isFinite(count) || (count > 0 && !accepted.length && !unknown.length)) throw new Error('Audit counts do not match findings');
  return { unknown, accepted };
}
if (require.main === module) {
  try {
    // npm_execpath is provided by `pnpm audit:security`; no shell or user arguments are evaluated.
    if (!process.env.npm_execpath) throw new Error('Run this check through pnpm audit:security');
    const result = spawnSync(process.execPath, [process.env.npm_execpath, 'audit', '--json'], { encoding: 'utf8', timeout: 120000, maxBuffer: 8 * 1024 * 1024 });
    if (result.error || ![0, 1].includes(result.status)) throw new Error('Audit registry request failed');
    const report = JSON.parse(result.stdout);
    const checked = checkAudit(report);
    console.log(JSON.stringify({ vulnerabilities: report.metadata.vulnerabilities, ...checked }, null, 2));
    if (checked.unknown.length) process.exitCode = 1;
  } catch (error) { console.error(`Security audit failed: ${error.message}`); process.exitCode = 1; }
}
module.exports = { checkAudit };
