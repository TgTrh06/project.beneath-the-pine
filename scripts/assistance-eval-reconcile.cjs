// Read-only Management reconciliation of one previously sent attempt; never calls a model.
const fs = require('node:fs');
const path = require('node:path');
const { EvalBudget, root } = require('./assistance-eval-budget.cjs');
const { credentials, management } = require('./beeknoee-trial.cjs');
const { matchUsage } = require('./assistance-eval-inference.cjs');

async function main() {
  const budget = new EvalBudget();
  try {
    const pending = budget.data.attempts.filter(item => item.costVND === null);
    if (pending.length !== 1) throw new Error('Exactly one pending attempt required');
    const row = pending[0], markerFile = path.join(root, 'current-case.json');
    const marker = JSON.parse(fs.readFileSync(markerFile, 'utf8'));
    if (marker.caseId !== row.caseId) throw new Error('Case marker does not match pending charge');
    const usage = await management('usage?limit=200', credentials());
    const charged = matchUsage(usage.data, row);
    if (!charged) throw new Error('Charge still unavailable; keep reservation and stop');
    budget.settle(row.attempt, charged, { result: 'response_unobserved_after_reconciliation_delay' });
    const file = path.join(root, 'responses.json'), rows = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (rows.some(item => item.id === row.caseId)) throw new Error('Response row already exists');
    rows.push({ id: row.caseId, observed: false, costVND: charged.costVND,
      promptTokens: charged.inputTokens, completionTokens: charged.outputTokens,
      unresolved: 'Response was not captured when Usage appeared after the request guard stopped; case is a content failure, not retried.' });
    const temporary = file + '.tmp'; fs.writeFileSync(temporary, JSON.stringify(rows, null, 2) + '\n'); fs.renameSync(temporary, file);
    fs.unlinkSync(markerFile);
    console.log(JSON.stringify({ reconciledCase: row.caseId, costVND: charged.costVND, providerCalls: budget.data.attempts.length,
      responseObserved: false }));
  } finally { budget.close(); }
}
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { main };
