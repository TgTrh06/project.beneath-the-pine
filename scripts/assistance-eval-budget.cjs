const fs = require('node:fs');
const path = require('node:path');
const { reserveCost } = require('./beeknoee-budget.cjs');
const { casebookSha256 } = require('./assistance-eval-report.cjs');

const MAX_CALLS = 48;
const MAX_VND = 200;
const MODEL = 'bee/gpt-6-luna';
const FORMAT = 'json_schema';
const root = path.resolve(__dirname, '../.openai/assistance-quality-v1');
const file = path.join(root, 'ledger.json');

class EvalBudget {
  constructor(location = file) {
    this.file = location;
    fs.mkdirSync(path.dirname(location), { recursive: true });
    this.lock = fs.openSync(location + '.lock', 'wx');
    try {
      if (!fs.existsSync(location)) fs.writeFileSync(location, JSON.stringify({ version: 1, casebookSha256, attempts: [], expectedBalanceVND: null }, null, 2));
      this.data = JSON.parse(fs.readFileSync(location, 'utf8'));
      if (this.data.version !== 1 || this.data.casebookSha256 !== casebookSha256 || !Array.isArray(this.data.attempts)) throw new Error('Invalid evaluation ledger');
      if (this.data.attempts.some(row => !Number.isFinite(row.reservedVND) || row.reservedVND <= 0 || row.costVND !== null && (!Number.isFinite(row.costVND) || row.costVND < 0))) throw new Error('Invalid evaluation charges');
    } catch (error) { this.close(); throw error; }
  }
  save() {
    const temporary = this.file + '.tmp';
    fs.writeFileSync(temporary, JSON.stringify(this.data, null, 2) + '\n');
    fs.renameSync(temporary, this.file);
  }
  total() { return this.data.attempts.reduce((sum, row) => sum + (row.costVND ?? row.reservedVND), 0); }
  reserve({ caseId, phase, reservedVND, balanceVND, baselineIds, modelName }) {
    if (!['development', 'holdout'].includes(phase) || !/^\w+-\d{2}$/.test(caseId)) throw new Error('Unapproved evaluation case');
    if (this.data.attempts.some(row => row.caseId === caseId)) throw new Error('Case already attempted');
    if (this.data.attempts.some(row => row.costVND === null)) throw new Error('Unreconciled charge; stop inference');
    if (this.data.attempts.length >= MAX_CALLS || this.total() + reservedVND > MAX_VND) throw new Error('Evaluation limit reached');
    if (!Number.isFinite(reservedVND) || reservedVND <= 0 || !Number.isFinite(balanceVND) || reservedVND > balanceVND) throw new Error('Insufficient verified balance');
    if (this.data.expectedBalanceVND !== null && Math.abs(this.data.expectedBalanceVND - balanceVND) > 0.02) throw new Error('Account balance changed outside this ledger');
    const row = { attempt: this.data.attempts.length + 1, caseId, phase, model: MODEL, format: FORMAT,
      reservedVND, costVND: null, balanceBeforeVND: balanceVND, baselineIds, modelName, started: new Date().toISOString() };
    this.data.attempts.push(row); this.save(); return row;
  }
  settle(attempt, usage, metadata) {
    const row = this.data.attempts.find(item => item.attempt === attempt);
    if (!row || row.costVND !== null || !Number.isFinite(usage.costVND) || usage.costVND < 0) throw new Error('Invalid settlement');
    Object.assign(row, { costVND: usage.costVND, usageId: usage.id, inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens, reasoningTokens: usage.reasoningTokens, ...metadata });
    this.data.expectedBalanceVND = Math.round((row.balanceBeforeVND - usage.costVND) * 100) / 100;
    this.save();
    if (usage.costVND > row.reservedVND || this.total() > MAX_VND) throw new Error('Actual billing exceeded reservation or run limit; stop');
  }
  close() { if (this.lock !== undefined) { fs.closeSync(this.lock); this.lock = undefined; fs.unlinkSync(this.file + '.lock'); } }
}
module.exports = { EvalBudget, reserveCost, MAX_CALLS, MAX_VND, MODEL, FORMAT, root, file };
