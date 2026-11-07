// Run after building contracts. Refuse silent drift with --check in CI/preflight.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '../..');
const contractRequire = createRequire(path.join(root, 'packages/contracts/package.json'));
const { z } = contractRequire('zod');
const c = require('../../packages/contracts/dist');
const sources = ['assistance.ts', 'assistance-prompt.ts'].map(name => fs.readFileSync(path.join(root, 'packages/contracts/src', name), 'utf8').replace(/\r\n/g, '\n')).join('\n');
const protocol = {
  revision: c.assistancePromptRevision,
  contract_sha256: crypto.createHash('sha256').update(sources).digest('hex'),
  system_prompt: c.assistanceSystemPrompt,
  request_schema: z.toJSONSchema(c.assistanceRequestSchema),
  output_schema: z.toJSONSchema(c.assistanceOutputSchema)
};
const value = JSON.stringify(protocol, null, 2) + '\n';
const target = path.join(root, 'ml/configs/assistance-protocol-v2.json');
if (process.argv.includes('--check')) {
  if (fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n') !== value) throw new Error('Protocol drift: rebuild contracts and export protocol');
} else fs.writeFileSync(target, value);
console.log(JSON.stringify({ protocol: protocol.revision, contract_sha256: protocol.contract_sha256 }));
