import type { AssistanceRequest } from '@pyneath/contracts';

// The shared Zod protocol has cross-field refinements which JSON Schema cannot
// export. Encode its mutually exclusive branches for this exact capability so a
// structured-output provider cannot mix suggestion and fallback fields.
export function assistanceOutputSchema(capability: AssistanceRequest['capability']) {
  const text = (maxLength: number) => ({ type: 'string', minLength: 1, maxLength });
  const base = { capability: { const: capability }, version: { const: '1' } };
  const object = (properties: Record<string, unknown>) => ({ type: 'object', properties: { ...base, ...properties },
    required: [...Object.keys(base), ...Object.keys(properties)], additionalProperties: false });
  const step = { needsHumanSupport: { const: false }, fallback: { const: 'manual_step' } };
  const suggestions = capability === 'assisted_start'
    ? [object({ ...step, activationStep: text(280), estimatedMinutes: { type: 'integer', enum: [3, 5, 10] } })]
    : capability === 'open_seed_draft'
      ? [object({ ...step, openSeedDraft: text(500) })]
      : [object({ ...step, recoveryAction: { type: 'string', enum: ['smaller_step', 'different_approach'] }, recoveryStep: text(280) }),
        object({ needsHumanSupport: { const: false }, fallback: { const: 'take_break' }, recoveryAction: { const: 'take_break' }, breakMinutes: { const: 2 } })];
  return { anyOf: [...suggestions,
    object({ ...step, message: text(300) }),
    object({ needsHumanSupport: { const: true }, fallback: { const: 'stop_and_return' }, message: text(300) }),
  ] };
}

