const fs = require('node:fs');
const path = require('node:path');
const MODELS = ['bee-tok/claude-haiku-5-5', 'bee/gpt-6-luna'];
const MAX_VND = 1375; // USD 0.05 at the documented 27,500 VND/USD rate.
const LIMITS = { compatibility: 6, evaluation: 18, ui: 3, reserve: 3 };

class TrialBudget {
  constructor(file) {
    this.file = file;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    // Exclusive ownership across the complete run, including management reads.
    // A crash leaves the lock for explicit inspection, never an automatic reset.
    this.lock = fs.openSync(file + '.lock', 'wx');
    try {
      if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify({ version: 1, attempts: [] }));
      this.data = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (this.data.version !== 1 || !Array.isArray(this.data.attempts)) throw new Error('Invalid trial ledger');
      for (const row of this.data.attempts) {
        if (!Number.isFinite(row.reservedVND) || row.reservedVND <= 0 ||
          (row.costVND !== null && (!Number.isFinite(row.costVND) || row.costVND < 0))) throw new Error('Invalid trial costs');
      }
    } catch (error) { this.close(); throw error; }
  }
  save() {
    const pending = this.file + '.tmp';
    fs.writeFileSync(pending, JSON.stringify(this.data, null, 2) + '\n');
    fs.renameSync(pending, this.file);
  }
  total() { return this.data.attempts.reduce((n, row) => n + (row.costVND ?? row.reservedVND), 0); }
  reserve({ model, phase, caseId, reservedVND }) {
    if (!MODELS.includes(model) || !Object.hasOwn(LIMITS, phase)) throw new Error('Unapproved model or phase');
    if (this.data.attempts.some(row => row.costVND === null)) throw new Error('Unreconciled attempt; inference stopped');
    if (this.data.attempts.some(row => row.model === model && row.caseId === caseId && row.phase === phase)) throw new Error('Case already attempted; use approved reserve phase explicitly');
    if (!Number.isFinite(reservedVND) || reservedVND <= 0 || this.total() + reservedVND > MAX_VND) throw new Error('Trial spend limit');
    if (this.data.attempts.length >= 30 || this.data.attempts.filter(row => row.phase === phase).length >= LIMITS[phase]) throw new Error('Trial call limit');
    if (phase === 'compatibility' && this.data.attempts.filter(row => row.model === model && row.phase === phase).length >= 3) throw new Error('Model compatibility limit');
    if (phase === 'evaluation' && this.data.attempts.filter(row => row.model === model && row.phase === phase).length >= 9) throw new Error('Model evaluation limit');
    const row = { attempt: this.data.attempts.length + 1, model, phase, caseId, reservedVND, costVND: null, started: new Date().toISOString() };
    this.data.attempts.push(row); this.save(); return row;
  }
  settle(attempt, costVND, metadata = {}) {
    if (!Number.isFinite(costVND) || costVND < 0) throw new Error('Unknown cost is not zero');
    const row = this.data.attempts.find(row => row.attempt === attempt);
    if (!row || row.costVND !== null) throw new Error('Invalid settlement');
    Object.assign(row, metadata, { costVND }); this.save();
    if (costVND > row.reservedVND || this.total() > MAX_VND) throw new Error('Provider billing exceeded reservation; stop and inspect');
  }
  close() { if (this.lock !== undefined) { fs.closeSync(this.lock); this.lock = undefined; fs.unlinkSync(this.file + '.lock'); } }
}

function reserveCost(body, pricing) {
  if (!MODELS.includes(body.model) || body.max_tokens !== 512 || body.stream !== false) throw new Error('Unbounded or unapproved trial payload');
  if (body.provider || body.tools) throw new Error('Unexpected routing/tools');
  const rates = [pricing.input, pricing.output];
  if (rates.some(rate => !Number.isFinite(rate) || rate < 0) || !rates.some(rate => rate > 0) || pricing.unit !== 'per_1M_tokens' || pricing.currency !== 'USD') throw new Error('Unverified pricing');
  if (pricing.reasoning != null && pricing.reasoning !== 0) throw new Error('Separate reasoning price needs review');
  // Deliberately reserve undiscounted prices, 15% surcharge, and UTF-8 bytes
  // instead of an optimistic token estimate, plus message framing allowance.
  const optional = [pricing.cache_read, pricing.cache_write].filter(value => value != null);
  if (optional.some(value => !Number.isFinite(value) || value < 0)) throw new Error('Unverified cache pricing');
  const inputRate = Math.max(pricing.input, ...optional);
  const bytes = Buffer.byteLength(JSON.stringify(body), 'utf8') + 1024;
  return Math.max(1, Math.ceil((bytes * inputRate + 512 * pricing.output) / 1e6 * 27500 * 1.15));
}
module.exports = { TrialBudget, reserveCost, MODELS, MAX_VND, LIMITS };
