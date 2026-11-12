// Explicit operator tool. Never invoked by normal app startup, build, or tests.
const fs = require('node:fs'), path = require('node:path'), https = require('node:https');
const { createRequire } = require('node:module');
const apiRequire = createRequire(path.resolve(__dirname, '../apps/api/package.json'));
const { TrialBudget, MODELS } = require('./beeknoee-budget.cjs');
const root = path.resolve(__dirname, '../.openai/beeknoee-trial');

function credentials() {
  const env = apiRequire('dotenv').parse(fs.readFileSync(path.resolve(__dirname, '../apps/api/.env')));
  if (!env.BEEKNOEE_API_KEY) throw new Error('Missing BEEKNOEE_API_KEY in apps/api/.env');
  return env.BEEKNOEE_API_KEY;
}
function management(route, key) {
  if (!['me', 'models/text', 'usage?limit=200'].includes(route)) throw new Error('Unsupported management read');
  return new Promise((resolve, reject) => {
    const request = https.get('https://platform.beeknoee.com/v1/management/' + route, {
      family: 4, headers: { Authorization: 'Bearer ' + key, 'User-Agent': 'Pyneath-Trial/0.1', Accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
    }, response => {
      let size = 0; const chunks = [];
      response.on('data', chunk => { size += chunk.length; if (size > 2e6) response.destroy(new Error('Management body limit')); else chunks.push(chunk); });
      response.on('error', () => reject(new Error('Management read failed')));
      response.on('end', () => {
        if (response.statusCode !== 200) return reject(new Error('Management HTTP ' + response.statusCode));
        try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch { reject(new Error('Invalid management JSON')); }
      });
    });
    request.on('error', () => reject(new Error('Management connection failed')));
  });
}
async function preflight(key) {
  const me = await management('me', key), catalog = await management('models/text', key), usage = await management('usage?limit=200', key);
  if (!Number.isFinite(me.balance?.totalVND) || !Number.isFinite(me.balance?.bonusVND) || !Array.isArray(catalog.data) || !Array.isArray(usage.data)) throw new Error('Unrecognized management response');
  const models = MODELS.map(id => {
    const model = catalog.data.find(row => row.model_id === id);
    if (!model) throw new Error('Approved model not in account catalog: ' + id);
    return { id, name: model.name, pricing: model.pricing, discount: model.discount, rateLimits: model.rate_limits };
  });
  const snapshot = { checkedAt: new Date().toISOString(), balanceVND: me.balance.totalVND, bonusVND: me.balance.bonusVND, plan: me.plan, models };
  return { snapshot, usage };
}
async function main() {
  if (process.argv[2] !== 'preflight') throw new Error('Usage: node scripts/beeknoee-trial.cjs preflight (no inference)');
  const ledger = new TrialBudget(path.join(root, 'ledger.json'));
  try {
    const { snapshot } = await preflight(credentials());
    fs.writeFileSync(path.join(root, 'preflight.json'), JSON.stringify(snapshot, null, 2) + '\n');
    console.log(JSON.stringify({ ...snapshot, inferenceAttempts: ledger.data.attempts.length }, null, 2));
  } finally { ledger.close(); }
}
module.exports = { credentials, management, preflight, root, apiRequire };
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
