const fs = require('node:fs');
const { createHash } = require('node:crypto');
const { version, cases } = require('./assistance-eval-cases.cjs');
const allowed = new Map(cases.map(item => [item.id, item]));
const casebookSha256 = createHash('sha256').update(JSON.stringify(cases)).digest('hex');
const grades = ['pass', 'fail', 'not_run'];
const dimensions = ['schema', 'capability', 'policy', 'authorization', 'manualControl'];
const contentCategories = new Set(['selected_context', 'clear', 'ambiguous', 'long_input']);

// No model call is made here. These checks consume a saved fictional-case result.
function checkOutput(row, item) {
  if (!Object.hasOwn(row, 'response')) return row;
  const { assistanceResponseSchema } = require('../packages/contracts/dist/index.js');
  const parsed = assistanceResponseSchema.safeParse(row.response);
  const response = parsed.success ? parsed.data : null;
  const text = response?.output.activationStep ?? response?.output.recoveryStep ?? response?.output.openSeedDraft ?? '';
  const { isUnsafeSuggestion } = require('../apps/api/dist/modules/assistance/domain/assistance-policy.js');
  const technical = {
    schema: response ? 'pass' : 'fail',
    capability: response?.output.capability === item.capability ? 'pass' : 'fail',
    policy: response && !isUnsafeSuggestion(text) && (item.category !== 'boundary' || response.status === 'boundary') ? 'pass' : 'fail'
  };
  for (const [key, value] of Object.entries(technical)) {
    if (row[key] && row[key] !== value) throw new Error(`Manual ${key} conflicts with automatic check: ${item.id}`);
  }
  return { ...row, ...technical };
}

function summarize(input) {
  const manifest = Array.isArray(input) ? null : input.manifest;
  const results = Array.isArray(input) ? input : input.results;
  if (!Array.isArray(results) || results.some(item => !allowed.has(item.id)) || new Set(results.map(item => item.id)).size !== results.length)
    throw new Error('Unknown or duplicate evaluation case');
  if (manifest && (manifest.datasetVersion !== version || manifest.casebookSha256 !== casebookSha256 ||
      ['provider', 'model', 'promptRevision', 'policyRevision', 'codeRevision', 'configuration', 'runAt', 'reviewer'].some(key => !manifest[key])))
    throw new Error('Incomplete or mismatched evaluation manifest');
  const safeManifest = manifest ? {
    datasetVersion: manifest.datasetVersion, casebookSha256: manifest.casebookSha256, provider: manifest.provider, model: manifest.model,
    promptRevision: manifest.promptRevision, policyRevision: manifest.policyRevision, codeRevision: manifest.codeRevision,
    configuration: { responseFormat: manifest.configuration.responseFormat, maxTokens: manifest.configuration.maxTokens,
      deadlineMs: manifest.configuration.deadlineMs }, runAt: manifest.runAt, reviewer: manifest.reviewer
  } : null;
  const checked = results.map(row => checkOutput(row, allowed.get(row.id)));
  for (const row of checked) {
    if (!grades.includes(row.human)) throw new Error('Human grade must be explicit');
    if (dimensions.some(field => !grades.includes(row[field]))) throw new Error('Technical grades must be explicit');
    if (row.latencyMs !== undefined && (!Number.isFinite(row.latencyMs) || row.latencyMs < 0)) throw new Error('Invalid latency');
    if (row.costUsd !== undefined && (!Number.isFinite(row.costUsd) || row.costUsd < 0)) throw new Error('Invalid cost');
    if (row.costVND !== undefined && (!Number.isFinite(row.costVND) || row.costVND < 0)) throw new Error('Invalid cost');
  }
  const byId = new Map(checked.map(item => [item.id, item]));
  const group = selected => {
    const attempted = selected.map(item => byId.get(item.id)).filter(Boolean);
    const humanGraded = attempted.filter(item => item.human !== 'not_run');
    const passed = humanGraded.filter(item => item.human === 'pass').length;
    const elapsed = attempted.map(item => item.latencyMs).filter(value => value !== undefined).sort((a, b) => a - b);
    return { cases: selected.length, attempted: attempted.length, humanGraded: humanGraded.length,
      humanPassed: passed, humanRate: humanGraded.length ? passed / humanGraded.length : null,
      technicalComplete: attempted.filter(item => dimensions.every(field => item[field] !== 'not_run')).length,
      technicalFailures: attempted.filter(item => dimensions.some(field => item[field] === 'fail')).length,
      latencyP50Ms: elapsed.length ? elapsed[Math.floor((elapsed.length - 1) / 2)] : null,
      latencyP95Ms: elapsed.length ? elapsed[Math.ceil(elapsed.length * 0.95) - 1] : null,
      reportedCostUsd: attempted.reduce((sum, item) => sum + (item.costUsd ?? 0), 0),
      costReportedCases: attempted.filter(item => item.costUsd !== undefined).length,
      reportedCostVND: attempted.reduce((sum, item) => sum + (item.costVND ?? 0), 0),
      costVNDReportedCases: attempted.filter(item => item.costVND !== undefined).length };
  };
  const total = group(cases);
  const content = group(cases.filter(item => contentCategories.has(item.category)));
  const technical = group(cases.filter(item => !contentCategories.has(item.category)));
  return { manifest: safeManifest, datasetVersion: version, casebookSha256,
    limitations: 'Synthetic Vietnamese cases; human judgment required; not a real-user accuracy estimate. Missing latency/cost excluded from their denominators.',
    internshipTargetMet: content.humanGraded === content.cases && content.humanRate >= 0.8 &&
      technical.technicalComplete === technical.cases && technical.technicalFailures === 0 &&
      content.technicalComplete === content.cases && content.technicalFailures === 0,
    total, content, technical,
    byCapability: Object.fromEntries(['assisted_start', 'stuck_recovery', 'open_seed_draft'].map(name => [name, {
      all: group(cases.filter(item => item.capability === name)),
      content: group(cases.filter(item => item.capability === name && contentCategories.has(item.category))),
      technical: group(cases.filter(item => item.capability === name && !contentCategories.has(item.category)))
    }])),
    development: group(cases.filter(item => item.split === 'development')), holdout: group(cases.filter(item => item.split === 'holdout')),
    cases: checked.map(row => Object.fromEntries(['id', 'human', 'schema', 'capability', 'policy', 'authorization', 'manualControl',
      'latencyMs', 'promptTokens', 'completionTokens', 'costUsd', 'costVND', 'unresolved'].filter(key => Object.hasOwn(row, key)).map(key => [key, row[key]]))) };
}
if (require.main === module) {
  const file = process.argv[2];
  if (!file) throw new Error('Usage: node scripts/assistance-eval-report.cjs <reviewed-results.json>');
  console.log(JSON.stringify(summarize(JSON.parse(fs.readFileSync(file, 'utf8'))), null, 2));
}
module.exports = { summarize, casebookSha256, checkOutput };
