// Operator-only local server hook. It never runs on normal API startup.
const fs = require('node:fs');
const path = require('node:path');
const { isDeepStrictEqual } = require('node:util');
const { credentials, preflight, management, apiRequire } = require('./beeknoee-trial.cjs');
const { EvalBudget, reserveCost, MODEL, FORMAT, root } = require('./assistance-eval-budget.cjs');
const { cases } = require('./assistance-eval-cases.cjs');
apiRequire('reflect-metadata');
const { BeeknoeeAssistanceProvider } = require('../apps/api/dist/modules/assistance/infrastructure/beeknoee-assistance.provider.js');
const originalGenerate = BeeknoeeAssistanceProvider.prototype.generate;
let inFlight = false;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function selectedCase(input) {
  const marker = JSON.parse(fs.readFileSync(path.join(root, 'current-case.json'), 'utf8'));
  const scenario = cases.find(item => item.id === marker.caseId);
  if (!scenario || !['selected_context', 'clear', 'ambiguous', 'long_input'].includes(scenario.category) ||
      marker.phase !== scenario.split || !isDeepStrictEqual(input, scenario.request)) throw new Error('Unapproved evaluation request');
  return { marker, scenario };
}
function matchUsage(data, row) {
  if (!Array.isArray(data)) throw new Error('Invalid usage response');
  const added = data.filter(item => !row.baselineIds.includes(item.id));
  if (added.length > 1 || added.some(item => item.model !== MODEL && item.model !== row.modelName)) throw new Error('Concurrent or ambiguous account usage');
  if (!added.length) return null;
  const entry = added[0];
  if (typeof entry.id !== 'string' || !Number.isFinite(entry.costVND) || entry.costVND < 0 ||
      !Number.isFinite(Date.parse(entry.date)) || Date.parse(entry.date) < Date.parse(row.started) - 5000) throw new Error('Unrecognized usage entry');
  return entry;
}
async function reconcile(key, row) {
  for (let i = 0; i < 10; i++) {
    if (i) await wait(1500);
    const usage = await management('usage?limit=200', key);
    const entry = matchUsage(usage.data, row);
    if (entry) return entry;
  }
  throw new Error('Charge unresolved; inference paused');
}
async function runOne(instance, input, tools) {
  if (inFlight) throw new Error('Concurrent inference denied');
  inFlight = true;
  let budget;
  const transport = instance.http, originalRequest = transport.request;
  let row, result, providerError;
  try {
    budget = new EvalBudget();
    const { marker, scenario } = selectedCase(input);
    const key = credentials();
    const { snapshot, usage } = await preflight(key);
    const modelInfo = snapshot.models.find(item => item.id === MODEL);
    if (!modelInfo || !Array.isArray(usage.data)) throw new Error('Luna price or usage unavailable');
    if (budget.data.attempts.some(item => item.costVND === null)) throw new Error('Pending charge; inference paused');
    transport.request = async options => {
      if (row) throw new Error('Multiple provider calls denied');
      const body = JSON.parse(options.body);
      if (body.model !== MODEL || body.max_tokens !== 512 || body.stream !== false || body.response_format?.type !== FORMAT ||
          body.provider || body.tools || body.reasoning) throw new Error('Unapproved provider payload');
      const sent = JSON.parse(body.messages?.[1]?.content ?? 'null');
      const expected = { ...scenario.request, ...(scenario.selectedContext ? { authorizedContext: scenario.selectedContext } : {}) };
      if (!isDeepStrictEqual(sent, expected)) throw new Error('Selected context mismatch');
      const reservedVND = reserveCost(body, modelInfo.pricing);
      row = budget.reserve({ caseId: scenario.id, phase: marker.phase, reservedVND,
        balanceVND: snapshot.balanceVND, baselineIds: usage.data.map(item => item.id), modelName: modelInfo.name });
      return originalRequest.call(transport, options);
    };
    try { result = await originalGenerate.call(instance, input, tools); }
    catch (error) { providerError = error; }
    if (!row) throw new Error('No provider call; inspect pre-call guard');
    const charged = await reconcile(key, row);
    budget.settle(row.attempt, charged, { result: providerError ? 'error' : result.kind,
      ...(result?.output ? { output: result.output } : {}) });
    if (providerError) throw new Error('Provider attempt failed after charge reconciliation');
    return result;
  } finally {
    transport.request = originalRequest;
    budget?.close(); inFlight = false;
  }
}
function install() {
  BeeknoeeAssistanceProvider.prototype.generate = function(input, tools) { return runOne(this, input, tools); };
}
module.exports = { install, runOne, matchUsage };
