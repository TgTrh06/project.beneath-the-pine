import { Inject, Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { assistanceOutputSchema, assistanceSystemPrompt, type AssistanceRequest } from '@pyneath/contracts';
import { API_CONFIG, type ApiConfig } from '../../../platform/config/api-config';
import type { AssistanceProvider, ProviderResult } from '../application/assistance-provider';
import { parseLocalOutput } from '../domain/assistance-policy';

const MAX_RESPONSE_BYTES = 32768;
const completionSchema = z.object({ choices: z.array(z.object({
  finish_reason: z.literal('stop'), message: z.object({ content: z.string() })
})).length(1) });

export async function readBoundedJson(response: Response): Promise<unknown> {
  if (!response.body || Number(response.headers.get('content-length')) > MAX_RESPONSE_BYTES) throw new Error('Invalid inference response');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_RESPONSE_BYTES) throw new Error('Invalid inference response');
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } finally { await reader.cancel().catch(() => undefined); }
}

@Injectable()
export class LocalAssistanceProvider implements AssistanceProvider {
  private readonly logger = new Logger(LocalAssistanceProvider.name);
  constructor(@Inject(API_CONFIG) private readonly config: ApiConfig) {}

  async generate(input: AssistanceRequest): Promise<ProviderResult> {
    const started = performance.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    let outcome = 'provider_error';
    try {
      if (!this.config.API_LOCAL_AI_URL || !this.config.API_LOCAL_AI_TOKEN || !this.config.API_LOCAL_AI_MODEL) throw new Error('Local inference is not configured');
      const response = await fetch(new URL('/v1/chat/completions', this.config.API_LOCAL_AI_URL), {
        method: 'POST', signal: controller.signal, redirect: 'error',
        headers: { Authorization: `Bearer ${this.config.API_LOCAL_AI_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.config.API_LOCAL_AI_MODEL, stream: false, temperature: 0, max_tokens: 512,
          messages: [{ role: 'system', content: assistanceSystemPrompt }, { role: 'user', content: JSON.stringify(input) }],
          response_format: { type: 'json_schema', json_schema: { name: 'pyneath_assistance', strict: true, schema: z.toJSONSchema(assistanceOutputSchema) } }
        })
      });
      if (!response.ok) { await response.body?.cancel(); throw new Error('Inference unavailable'); }
      outcome = 'schema_rejection';
      const completion = completionSchema.parse(await readBoundedJson(response));
      const output = parseLocalOutput(input, JSON.parse(completion.choices[0].message.content));
      if (output.needsHumanSupport) { outcome = 'boundary'; return { kind: 'boundary' }; }
      if (output.message !== undefined) { outcome = 'fallback'; return { kind: 'fallback' }; }
      outcome = 'suggestion';
      return { kind: 'validated', output };
    } finally {
      clearTimeout(timer);
      if (this.config.API_LOG_LEVEL !== 'silent') this.logger.log({
        capability: input.capability, modelVersion: this.config.API_LOCAL_AI_MODEL,
        elapsedMs: Math.round(performance.now() - started), outcome: controller.signal.aborted ? 'timeout' : outcome
      });
    }
  }
}
