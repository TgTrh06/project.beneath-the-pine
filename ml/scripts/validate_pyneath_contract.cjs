/* Validate JSONL against the actual built Zod contract. Build contracts first. */
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');
const crypto = require('node:crypto');

async function main() {
  const sourcePath = path.resolve(__dirname, '../../packages/contracts/src/assistance.ts');
  const source = fs.readFileSync(sourcePath, 'utf8');
  const contract = require('../../packages/contracts/dist');
  const input = readline.createInterface({ input: fs.createReadStream(process.argv[2], { encoding: 'utf8' }), crlfDelay: Infinity });
  let rows = 0;
  for await (const line of input) {
    if (!line.trim()) continue;
    const row = JSON.parse(line);
    try {
      contract.assistanceRequestSchema.parse(JSON.parse(row.messages[1].content));
      const output = contract.assistanceOutputSchema.parse(JSON.parse(row.messages[2].content));
      const envelope = { status: row.expected_status, output };
      if (envelope.status === 'suggestion') envelope.suggestionId = '00000000-0000-4000-8000-000000000000';
      contract.assistanceResponseSchema.parse(envelope);
    } catch {
      throw new Error(`Contract rejection at ${row.scenario_id}`);
    }
    rows++;
  }
  if (!rows) throw new Error('Empty dataset');
  console.log(JSON.stringify({ rows, request_output_response_contract: 'passed', contract_sha256: crypto.createHash('sha256').update(source).digest('hex') }));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
