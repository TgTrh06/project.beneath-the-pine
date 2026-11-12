const fs = require('node:fs'), path = require('node:path');
const { TrialBudget, reserveCost, MODELS } = require('./beeknoee-budget.cjs');
const { credentials, preflight, management, root, apiRequire } = require('./beeknoee-trial.cjs');
const cases = require('./beeknoee-cases.cjs');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function matchUsage(data, row, baselineIds) {
  if (!Array.isArray(data)) throw new Error('Invalid usage; stop');
  const added = data.filter(item => !baselineIds.includes(item.id));
  if (added.length > 1 || added.some(item => item.model !== row.model && item.model !== row.modelName)) throw new Error('Concurrent usage cannot be attributed; stop');
  if (!added.length) return null;
  const entry = added[0];
  if (typeof entry.id !== 'string' || !Number.isFinite(entry.costVND) || entry.costVND < 0 || !Number.isFinite(Date.parse(entry.date)) || Date.parse(entry.date) < Date.parse(row.started) - 5000) throw new Error('Unrecognized usage entry; stop');
  return entry;
}

async function reconcile(key, ledger, row, baselineIds, metadata) {
  for (let i = 0; i < 4; i++) {
    if (i) await sleep(1500);
    const usage = await management('usage?limit=200', key);
    // Without a request-ID correlation, any concurrent account activity is ambiguous.
    const entry = matchUsage(usage.data, row, baselineIds);
    if (entry) {
      ledger.settle(row.attempt, entry.costVND, { ...metadata, inputTokens: entry.inputTokens, outputTokens: entry.outputTokens, reasoningTokens: entry.reasoningTokens });
      return;
    }
  }
  throw new Error('No attributable usage yet; reservation retained; no further inference');
}

async function runOne({ model, format, phase, scenario, authorizedTools, generate }) {
  if (!MODELS.includes(model) || !['json_schema', 'json_object', 'prompt'].includes(format)) throw new Error('Unapproved trial configuration');
  const ledger = new TrialBudget(path.join(root, 'ledger.json'));
  let row;
  try {
    if (ledger.data.attempts.some(item => item.costVND === null)) throw new Error('Pending cost; use reconcile before inference');
    const key = credentials(), { snapshot, usage } = await preflight(key);
    const modelInfo = snapshot.models.find(item => item.id === model);
    if (snapshot.balanceVND < 1) throw new Error('Insufficient balance');
    apiRequire('reflect-metadata');
    const base = path.resolve(__dirname, '../apps/api/dist');
    const { BeeknoeeAssistanceProvider } = require(base + '/modules/assistance/infrastructure/beeknoee-assistance.provider');
    const { BeeknoeeHttpTransport } = require(base + '/modules/assistance/infrastructure/beeknoee-http');
    const { readBoundedJson } = require(base + '/modules/assistance/infrastructure/local-assistance.provider');
    const { readApiConfig } = require(base + '/platform/config/api-config');
    const transport = new BeeknoeeHttpTransport(), original = transport.request.bind(transport);
    const baselineIds = usage.data.map(item => item.id);
    let wire = {};
    transport.request = async options => {
      const body = JSON.parse(options.body), reservedVND = reserveCost(body, modelInfo.pricing);
      if (reservedVND > snapshot.balanceVND) throw new Error('Insufficient balance for reservation');
      if (row) throw new Error('Multiple calls denied');
      row = ledger.reserve({ model, phase, caseId: scenario.id, reservedVND });
      Object.assign(row, { format, baselineIds, modelName: modelInfo.name }); ledger.save();
      const response = await original(options);
      wire.httpStatus = response.status;
      // Bound the monitor's read as well as the application's own parser.
      const value = await readBoundedJson(response);
      if (!response.ok) {
        const errorText = typeof value?.error?.message === 'string' ? value.error.message : '';
        wire.unsupportedFormat = response.status === 400 && /response_format|json_schema|json_object/i.test(errorText) && /unsupported|not supported|not support|unknown parameter/i.test(errorText);
      }
      return Response.json(value, { status: response.status });
    };
    const config = readApiConfig({ API_ASSISTANCE_PROVIDER: 'beeknoee', BEEKNOEE_API_KEY: key, BEEKNOEE_MODEL: model, BEEKNOEE_RESPONSE_FORMAT: format, API_LOG_LEVEL: 'silent' });
    const provider = new BeeknoeeAssistanceProvider(config, transport);
    const tools = authorizedTools ?? (scenario.context ? { names: Object.keys(scenario.context), read: async name => scenario.context[name] } : undefined);
    const started = performance.now(); let result;
    try { result = await (generate ?? provider.generate).call(provider, scenario.request, tools); }
    catch { result = { kind: 'error' }; }
    const metadata = { ...wire, elapsedMs: Math.round(performance.now() - started), result: result.kind, capability: scenario.request.capability, ...(result.output ? { output: result.output } : {}) };
    if (!row) throw new Error('No inference sent; inspect pre-call guard');
    Object.assign(row, metadata); ledger.save();
    await reconcile(key, ledger, row, baselineIds, metadata);
    console.log(JSON.stringify({ ...metadata, attempt: row.attempt, model, caseId: scenario.id, costVND: row.costVND, totalVND: ledger.total() }));
    return { row, result };
  } finally { ledger.close(); }
}
async function main() {
  const [command, modelIndex, format = 'json_schema', caseId] = process.argv.slice(2);
  if (command === 'reconcile') {
    const ledger = new TrialBudget(path.join(root, 'ledger.json'));
    try {
      const row = ledger.data.attempts.find(row => row.costVND === null);
      if (!row || !row.baselineIds) throw new Error('No reconcilable attempt');
      if (!row.modelName) {
        const { snapshot } = await preflight(credentials());
        row.modelName = snapshot.models.find(item => item.id === row.model).name; ledger.save();
      }
      await reconcile(credentials(), ledger, row, row.baselineIds, {});
      console.log(JSON.stringify({ attempt: row.attempt, costVND: row.costVND, totalVND: ledger.total() }));
    } finally { ledger.close(); }
    return;
  }
  const model = MODELS[Number(modelIndex)];
  if (!model || !['probe', 'evaluate', 'reserve'].includes(command)) throw new Error('Usage: node scripts/beeknoee-run.cjs probe|evaluate|reserve 0|1 json_schema|json_object|prompt [case-id], or reconcile');
  if (command === 'evaluate') {
    const data = JSON.parse(fs.readFileSync(path.join(root, 'ledger.json')));
    if (!data.attempts.some(row => row.phase === 'compatibility' && row.model === model && row.format === format && row.result === 'validated' && row.costVND !== null)) throw new Error('No successful compatibility evidence for this format');
    for (const scenario of cases) {
      const current = JSON.parse(fs.readFileSync(path.join(root, 'ledger.json')));
      if (!current.attempts.some(row => row.phase === 'evaluation' && row.model === model && row.caseId === scenario.id)) await runOne({ model, format, phase: 'evaluation', scenario });
    }
  } else {
    if (command === 'probe') {
      const data = JSON.parse(fs.readFileSync(path.join(root, 'ledger.json')));
      const previous = { json_object: 'json_schema', prompt: 'json_object' }[format];
      if (previous && !data.attempts.some(row => row.model === model && row.phase === 'compatibility' && row.format === previous && row.unsupportedFormat === true && row.costVND !== null)) throw new Error('Format downgrade requires explicit unsupported-format evidence');
    }
    const scenario = command === 'probe' ? { ...cases[0], id: 'probe-' + format } : cases.find(item => item.id === caseId);
    if (!scenario) throw new Error('Unknown fixed case');
    await runOne({ model, format, phase: command === 'probe' ? 'compatibility' : 'reserve', scenario });
  }
}
module.exports = { runOne, reconcile, matchUsage };
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
