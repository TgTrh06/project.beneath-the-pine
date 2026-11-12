// Local-only operator script. Explicit stage argument is required for paid inference.
const fs = require('node:fs');
const path = require('node:path');
const { randomBytes, randomUUID, createHash } = require('node:crypto');
const { isDeepStrictEqual } = require('node:util');
const { cases, version } = require('./assistance-eval-cases.cjs');
const { casebookSha256 } = require('./assistance-eval-report.cjs');
const { root, file: ledgerFile, MAX_CALLS, MAX_VND, MODEL, FORMAT } = require('./assistance-eval-budget.cjs');
const { credentials, preflight } = require('./beeknoee-trial.cjs');
const { createRequire } = require('node:module');
const apiRequire = createRequire(path.resolve(__dirname, '../apps/api/package.json'));
const { assistanceResponseSchema } = apiRequire('@pyneath/contracts');
const base = 'http://127.0.0.1:18087/api/v1';
const origin = 'http://127.0.0.1:15177';
const content = cases.filter(item => ['selected_context', 'clear', 'ambiguous', 'long_input'].includes(item.category));
const canaryIds = new Set(['assisted_start-02', 'stuck_recovery-02', 'open_seed_draft-02']);
const markerFile = path.join(root, 'current-case.json');
const resultFile = path.join(root, 'responses.json');
const manifestFile = path.join(root, 'manifest.json');

function revision() {
  const files = [
    'scripts/assistance-eval-cases.cjs', 'scripts/assistance-eval-budget.cjs', 'scripts/assistance-eval-inference.cjs',
    'scripts/assistance-eval-server.cjs', 'scripts/assistance-eval-run.cjs',
    'apps/api/src/modules/assistance/infrastructure/beeknoee-assistance.provider.ts',
    'apps/api/src/modules/assistance/application/assistance.service.ts',
    'apps/api/src/modules/assistance/domain/assistance-policy.ts',
    'apps/api/src/modules/assistance/infrastructure/assistance-output-schema.ts',
    'packages/contracts/src/assistance.ts', 'packages/contracts/src/assistance-prompt.ts'
  ];
  const hash = createHash('sha256');
  for (const name of files) { hash.update(name); hash.update(fs.readFileSync(path.resolve(__dirname, '..', name))); }
  return hash.digest('hex');
}
function manifest() {
  fs.mkdirSync(root, { recursive: true });
  const expected = { datasetVersion: version, casebookSha256, provider: 'beeknoee', model: MODEL,
    promptRevision: 'pyneath-assistance-v2.1-beeknoee-v1', policyRevision: 'assistance-policy-v1',
    codeRevision: revision(), configuration: { responseFormat: FORMAT, maxTokens: 512, deadlineMs: 12000 },
    runAt: new Date().toISOString(), reviewer: 'internal-single-reviewer' };
  if (!fs.existsSync(manifestFile)) fs.writeFileSync(manifestFile, JSON.stringify(expected, null, 2) + '\n');
  const saved = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  if (!isDeepStrictEqual({ ...saved, runAt: expected.runAt }, expected)) throw new Error('Code, casebook or configuration changed during evaluation');
  return saved;
}
function stored() { return fs.existsSync(resultFile) ? JSON.parse(fs.readFileSync(resultFile, 'utf8')) : []; }
function saveResults(rows) {
  const temporary = resultFile + '.tmp'; fs.writeFileSync(temporary, JSON.stringify(rows, null, 2) + '\n'); fs.renameSync(temporary, resultFile);
}
function ledger() { return fs.existsSync(ledgerFile) ? JSON.parse(fs.readFileSync(ledgerFile, 'utf8')) : { attempts: [] }; }

class Client {
  constructor() { this.cookie = ''; this.csrf = ''; this.password = randomBytes(20).toString('hex'); }
  async request(route, method = 'GET', data, expected = 200) {
    const response = await fetch(base + route, { method, signal: AbortSignal.timeout(30000), headers: {
      Origin: origin, cookie: this.cookie, 'Content-Type': 'application/json',
      ...(method === 'GET' ? {} : { 'X-XSRF-TOKEN': this.csrf })
    }, body: data === undefined ? undefined : JSON.stringify(data) });
    for (const value of response.headers.getSetCookie()) if (value.startsWith('PYNEATH_SESSION=')) this.cookie = value.split(';')[0];
    const body = response.status === 204 ? {} : await response.json();
    if (body.csrfToken) this.csrf = body.csrfToken;
    if (response.status !== expected) throw new Error(`Local API ${route} returned ${response.status}; stop`);
    return body;
  }
  async register() {
    await this.request('/auth/session');
    await this.request('/auth/register', 'POST', { email: `assistance-eval-${randomUUID()}@example.test`, password: this.password }, 201);
  }
}

async function one(client, scenario, rows) {
  if (fs.existsSync(markerFile)) throw new Error('Unresolved current-case marker; inspect before continuing');
  const old = ledger();
  if (old.attempts.some(item => item.costVND === null)) throw new Error('Unreconciled charge; stop');
  if (old.attempts.length >= MAX_CALLS || old.attempts.some(item => item.caseId === scenario.id)) throw new Error('Call limit or duplicate case');
  let route = '/me/assistance', body = scenario.request;
  if (scenario.selectedContext) {
    const text = scenario.selectedContext.get_my_open_seed.text;
    await client.request('/me/open-seed', 'PUT', { text });
    const preview = await client.request('/me/assistance/tools/context');
    const selected = preview.tools.find(item => item.name === 'get_my_open_seed');
    if (selected?.data?.text !== text || !selected.consentToken) throw new Error('Selected context preview mismatch');
    route += '/tools'; body = { request: scenario.request, grants: [{ name: selected.name, consentToken: selected.consentToken }] };
  }
  fs.writeFileSync(markerFile, JSON.stringify({ caseId: scenario.id, phase: scenario.split }), { flag: 'wx' });
  const started = performance.now();
  const response = await client.request(route, 'POST', body, 201);
  const elapsedMs = Math.round(performance.now() - started);
  const parsed = assistanceResponseSchema.safeParse(response);
  const after = ledger(), charged = after.attempts.find(item => item.caseId === scenario.id);
  if (!charged || charged.costVND === null) throw new Error('Provider attempt missing or charge unresolved; stop');
  const record = { id: scenario.id, response, latencyMs: elapsedMs, costVND: charged.costVND,
    promptTokens: charged.inputTokens, completionTokens: charged.outputTokens };
  rows.push(record); saveResults(rows); fs.unlinkSync(markerFile);
  console.log(JSON.stringify({ id: scenario.id, status: response.status, costVND: charged.costVND, calls: after.attempts.length,
    totalVND: after.attempts.reduce((sum, item) => sum + item.costVND, 0) }));
  const expectedAmbiguousFallback = scenario.category === 'ambiguous' && response.status === 'fallback' && !response.reason;
  if (!parsed.success || response.output.capability !== scenario.capability ||
      response.status !== 'suggestion' && !expectedAmbiguousFallback) throw new Error('Invalid or unexpected fallback; stop for review');
}

async function main() {
  const stage = process.argv[2];
  if (!['preflight', 'canary', 'development', 'holdout'].includes(stage)) throw new Error('Usage: node scripts/assistance-eval-run.cjs preflight|canary|development|holdout');
  const { snapshot } = await preflight(credentials());
  const model = snapshot.models.find(item => item.id === MODEL);
  if (!model || !Number.isFinite(snapshot.balanceVND)) throw new Error('Luna balance/price unavailable');
  if (stage === 'preflight') { console.log(JSON.stringify({ balanceVND: snapshot.balanceVND, model: MODEL, pricing: model.pricing,
    callCap: MAX_CALLS, costCapVND: MAX_VND })); return; }
  manifest();
  const rows = stored(), past = ledger();
  if (rows.some(item => !past.attempts.some(row => row.caseId === item.id && row.costVND !== null)) ||
      past.attempts.some(item => item.costVND !== null && !rows.some(row => row.id === item.caseId))) throw new Error('Ledger and responses disagree; inspect before continuing');
  if (past.attempts.some(item => item.costVND === null) || fs.existsSync(markerFile)) throw new Error('Unresolved attempt; inspect before continuing');
  const canaries = content.filter(item => canaryIds.has(item.id));
  if (stage !== 'canary' && canaries.some(item => !rows.some(row => row.id === item.id && row.response.status === 'suggestion'))) throw new Error('Canary gate incomplete');
  const development = content.filter(item => item.split === 'development');
  if (stage === 'holdout' && development.some(item => !rows.some(row => row.id === item.id))) throw new Error('Development gate incomplete');
  const batch = content.filter(item => stage === 'canary' ? canaryIds.has(item.id) :
    stage === 'development' ? item.split === 'development' && !canaryIds.has(item.id) : item.split === 'holdout');
  const pending = batch.filter(item => !rows.some(row => row.id === item.id));
  if (!pending.length) { console.log(JSON.stringify({ stage, pending: 0, calls: past.attempts.length })); return; }
  const clients = Array.from({ length: 5 }, () => new Client());
  for (const client of clients) await client.register();
  for (let i = 0; i < pending.length; i++) await one(clients[i % clients.length], pending[i], rows);
}
module.exports = { revision, manifest, Client, canaryIds };
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
