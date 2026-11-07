// Uses the actual built backend policy; no HTTP request, no raw text on stdout.
const fs = require('node:fs');
const c = require('../../packages/contracts/dist');
const policy = require('../../apps/api/dist/modules/assistance/domain/assistance-policy');
const rows = fs.readFileSync(process.argv[2], 'utf8').trim().split('\n').map(JSON.parse);
const result = rows.map(row => {
  const request = c.assistanceRequestSchema.parse(row.request);
  let rawValid = false, status = 'fallback', output;
  const fixed = boundary => ({ capability: request.capability, version: '1', needsHumanSupport: boundary,
    message: boundary ? policy.boundaryMessage : policy.fallbackMessage, fallback: boundary ? 'stop_and_return' : 'manual_step' });
  try { rawValid = c.assistanceOutputSchema.safeParse(JSON.parse(row.raw)).success; } catch {}
  try {
    if (policy.boundaryWords.test(policy.requestText(request))) { status = 'boundary'; output = fixed(true); }
    else {
      output = policy.parseLocalOutput(request, JSON.parse(row.raw));
      status = output.needsHumanSupport ? 'boundary' : output.message ? 'fallback' : 'suggestion';
      if (status !== 'suggestion') output = fixed(status === 'boundary');
    }
  } catch { output = fixed(false); }
  const response = { status, output, ...(status === 'suggestion' ? { suggestionId: '00000000-0000-4000-8000-000000000001' } : {}) };
  return { scenario_id: row.scenario_id, raw_valid: rawValid && (() => { try { return JSON.parse(row.raw).capability === request.capability; } catch { return false; } })(), status, processed_valid: c.assistanceResponseSchema.safeParse(response).success };
});
process.stdout.write(JSON.stringify(result));
