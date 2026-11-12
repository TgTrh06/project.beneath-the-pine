// Twelve fictional technical/safety cases. No network inference or product database.
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { createRequire } = require('node:module');
const { cases } = require('./assistance-eval-cases.cjs');
const { checkOutput } = require('./assistance-eval-report.cjs');
const { root } = require('./assistance-eval-budget.cjs');
const apiRequire = createRequire(path.resolve(__dirname, '../apps/api/package.json'));
apiRequire('reflect-metadata');
const { AssistanceService } = require('../apps/api/dist/modules/assistance/application/assistance.service.js');
const { assistanceConfiguration } = require('../apps/api/dist/modules/assistance/infrastructure/assistance-configuration.js');
const { readApiConfig } = require('../apps/api/dist/platform/config/api-config.js');

async function runTechnical() {
  const selected = cases.filter(item => ['boundary', 'malformed_output', 'timeout', 'stale_grant'].includes(item.category));
  const rows = [];
  for (const item of selected) {
    let providerCalls = 0, reservations = 0, productMutations = 0;
    const provider = { generate: async () => {
      providerCalls++;
      if (item.category === 'malformed_output') throw new SyntaxError('Invalid JSON');
      if (item.category === 'timeout') throw new Error('Assistance deadline');
      throw new Error('Provider must not be called');
    } };
    const analytics = { reserveAssistanceRequest: async () => { reservations++; return randomUUID(); },
      ownsAssistanceRequest: async () => false, record: async () => undefined };
    const context = { authorize: async () => { throw new Error('Expired synthetic grant'); } };
    const config = assistanceConfiguration(readApiConfig({ API_ASSISTANCE_PROVIDER: 'beeknoee', BEEKNOEE_API_KEY: 'fixture' }));
    const service = new AssistanceService(config, provider, analytics, context);
    const grants = item.category === 'stale_grant' ? [{ name: 'get_my_open_seed', consentToken: 'expired-fixture' }] : undefined;
    const response = await service.suggest('synthetic-account', item.request, grants);
    const expected = item.category === 'boundary' ? ['boundary', undefined, 0, 0] :
      item.category === 'stale_grant' ? ['fallback', 'context_expired', 0, 0] :
        item.category === 'timeout' ? ['fallback', 'timeout', 1, 1] : ['fallback', 'invalid_output', 1, 1];
    const behavior = response.status === expected[0] && response.reason === expected[1] &&
      providerCalls === expected[2] && reservations === expected[3] && productMutations === 0;
    const checked = checkOutput({ id: item.id, response, human: 'not_run', authorization: behavior ? 'pass' : 'fail',
      manualControl: productMutations === 0 ? 'pass' : 'fail' }, item);
    rows.push(checked);
  }
  return rows;
}
if (require.main === module) runTechnical().then(rows => {
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(path.join(root, 'technical.json'), JSON.stringify(rows, null, 2) + '\n');
  const failed = rows.filter(item => ['schema', 'capability', 'policy', 'authorization', 'manualControl'].some(key => item[key] !== 'pass'));
  console.log(JSON.stringify({ technicalCases: rows.length, passed: rows.length - failed.length, failed: failed.map(item => item.id) }));
  if (failed.length) process.exitCode = 1;
}).catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { runTechnical };
