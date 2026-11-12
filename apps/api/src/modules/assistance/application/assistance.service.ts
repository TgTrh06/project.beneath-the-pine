import { BusinessError } from '../../../shared/kernel/business-error';
import { assistanceResponseSchema, type AssistanceConfig, type AssistanceInteraction, type AssistanceRequest, type AssistanceResponse } from '@pyneath/contracts';
import type { Analytics } from '../../analytics/public-api';
import { ProviderRateLimitError, type AssistanceProvider, type ProviderUsage } from './assistance-provider';
import type { AssistanceContextAccess } from './assistance-tools';
import type { AssistanceToolRequest } from '@pyneath/contracts';

import { boundaryWords, boundaryMessage, fallbackMessage, requestText } from '../domain/assistance-policy';
import { assistancePromptRevision } from '@pyneath/contracts';

export class AssistanceService {
  constructor(
    private readonly config: AssistanceConfig,
    private readonly provider: AssistanceProvider,
    private readonly analytics: Analytics,
    private readonly context?: AssistanceContextAccess,
    private readonly version?: { provider: string; model: string; promptRevision?: string; diagnostics?: boolean }
  ) { }

  configuration(): AssistanceConfig { return { ...this.config, capabilities: [...this.config.capabilities] }; }

  private fallback(capability: AssistanceRequest['capability'], boundary: boolean, reason?: AssistanceResponse['reason']): AssistanceResponse {
    return assistanceResponseSchema.parse({
      status: boundary ? 'boundary' : 'fallback',
      output: { capability, version: '1', needsHumanSupport: boundary, message: boundary ? boundaryMessage : fallbackMessage, fallback: boundary ? 'stop_and_return' : 'manual_step' },
      ...(reason ? { reason } : {})
    });
  }

  async suggest(accountId: string, input: AssistanceRequest, grants?: AssistanceToolRequest['grants']): Promise<AssistanceResponse> {
    const started = performance.now();
    const resultEvent = (outcome: string, usage?: ProviderUsage) => !this.version?.diagnostics ? Promise.resolve() : this.analytics.record(accountId, 'assistance_result', undefined, {
      capability: input.capability, outcome, provider: this.version?.provider ?? 'unknown', model: this.version?.model ?? 'unknown',
      promptRevision: this.version?.promptRevision ?? assistancePromptRevision, policyRevision: 'assistance-policy-v1', elapsedMs: Math.round(performance.now() - started),
      ...(usage ?? {})
    });
    const text = requestText(input);
    if (boundaryWords.test(text)) { await resultEvent('boundary'); return this.fallback(input.capability, true); }
    if (!this.configuration().capabilities.includes(input.capability)) { await resultEvent('fallback'); return this.fallback(input.capability, false); }
    try {
      if (grants && !this.context) { await resultEvent('fallback'); return this.fallback(input.capability, false); }
      let tools;
      try { tools = grants ? await this.context!.authorize(accountId, grants) : undefined; }
      catch { await resultEvent('context_expired'); return this.fallback(input.capability, false, 'context_expired'); }
      const suggestionId = await this.analytics.reserveAssistanceRequest(accountId, input.capability);
      if (!suggestionId) {
        await this.analytics.record(accountId, 'assistance_fallback', undefined, { capability: input.capability });
        await resultEvent('quota');
        return this.fallback(input.capability, false, 'quota');
      }
      const result = await this.provider.generate(input, tools);
      if (result.kind === 'boundary') { await resultEvent('boundary', result.usage); return this.fallback(input.capability, true); }
      if (result.kind === 'fallback') { await resultEvent('fallback', result.usage); return this.fallback(input.capability, false); }
      const output = result.output;
      if (output.capability !== input.capability) { await resultEvent('invalid_output', result.usage); return this.fallback(input.capability, false, 'invalid_output'); }
      if (output.needsHumanSupport) { await resultEvent('boundary', result.usage); return this.fallback(input.capability, true); }
      if ('message' in output && output.message !== undefined) { await resultEvent('fallback', result.usage); return this.fallback(input.capability, false); }
      const response = assistanceResponseSchema.parse({ status: 'suggestion', suggestionId, output });
      await resultEvent('suggestion', result.usage); return response;
    } catch (error) {
      await this.analytics.record(accountId, 'assistance_fallback', undefined, { capability: input.capability });
      const reason = error instanceof ProviderRateLimitError ? 'quota' : error instanceof Error && /deadline/i.test(error.message) ? 'timeout' : error instanceof SyntaxError || error instanceof Error && /schema|json|invalid|incomplete|too large/i.test(error.message) ? 'invalid_output' : 'unavailable';
      await resultEvent(reason === 'invalid_output' ? 'invalid_output' : reason === 'quota' ? 'quota' : reason === 'timeout' ? 'timeout' : 'provider_error');
      return this.fallback(input.capability, false, reason);
    }
  }

  async interaction(accountId: string, input: AssistanceInteraction): Promise<void> {
    if (!await this.analytics.ownsAssistanceRequest(accountId, input.suggestionId, input.capability)) throw new BusinessError('NOT_FOUND');
    const events = { viewed: 'assistance_viewed', selected: 'assistance_selected', edited: 'assistance_edited', discarded: 'assistance_discarded' } as const;
    await this.analytics.record(accountId, events[input.action], input.suggestionId, { capability: input.capability,
      ...(this.version?.diagnostics && input.reason ? { reason: input.reason } : {}) });
  }
}
