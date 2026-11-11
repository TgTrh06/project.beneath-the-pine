import { BusinessError } from '../../../shared/kernel/business-error';
import { assistanceResponseSchema, type AssistanceConfig, type AssistanceInteraction, type AssistanceRequest, type AssistanceResponse } from '@pyneath/contracts';
import type { Analytics } from '../../analytics/public-api';
import type { AssistanceProvider } from './assistance-provider';
import type { AssistanceContextAccess } from './assistance-tools';
import type { AssistanceToolRequest } from '@pyneath/contracts';

import { boundaryWords, boundaryMessage, fallbackMessage, requestText } from '../domain/assistance-policy';

export class AssistanceService {
  constructor(
    private readonly config: AssistanceConfig,
    private readonly provider: AssistanceProvider,
    private readonly analytics: Analytics,
    private readonly context?: AssistanceContextAccess
  ) { }

  configuration(): AssistanceConfig { return { ...this.config, capabilities: [...this.config.capabilities] }; }

  private fallback(capability: AssistanceRequest['capability'], boundary: boolean): AssistanceResponse {
    return assistanceResponseSchema.parse({
      status: boundary ? 'boundary' : 'fallback',
      output: { capability, version: '1', needsHumanSupport: boundary, message: boundary ? boundaryMessage : fallbackMessage, fallback: boundary ? 'stop_and_return' : 'manual_step' }
    });
  }

  async suggest(accountId: string, input: AssistanceRequest, grants?: AssistanceToolRequest['grants']): Promise<AssistanceResponse> {
    const text = requestText(input);
    if (boundaryWords.test(text)) return this.fallback(input.capability, true);
    if (!this.configuration().capabilities.includes(input.capability)) return this.fallback(input.capability, false);
    try {
      if (grants && !this.context) return this.fallback(input.capability, false);
      const tools = grants ? await this.context!.authorize(accountId, grants) : undefined;
      const suggestionId = await this.analytics.reserveAssistanceRequest(accountId, input.capability);
      if (!suggestionId) {
        await this.analytics.record(accountId, 'assistance_fallback', undefined, { capability: input.capability });
        return this.fallback(input.capability, false);
      }
      const result = await this.provider.generate(input, tools);
      if (result.kind === 'boundary') return this.fallback(input.capability, true);
      if (result.kind === 'fallback') return this.fallback(input.capability, false);
      const output = result.output;
      if (output.capability !== input.capability) return this.fallback(input.capability, false);
      if (output.needsHumanSupport) return this.fallback(input.capability, true);
      if ('message' in output && output.message !== undefined) return this.fallback(input.capability, false);
      return assistanceResponseSchema.parse({ status: 'suggestion', suggestionId, output });
    } catch {
      await this.analytics.record(accountId, 'assistance_fallback', undefined, { capability: input.capability });
      return this.fallback(input.capability, false);
    }
  }

  async interaction(accountId: string, input: AssistanceInteraction): Promise<void> {
    if (!await this.analytics.ownsAssistanceRequest(accountId, input.suggestionId, input.capability)) throw new BusinessError('NOT_FOUND');
    const events = { viewed: 'assistance_viewed', selected: 'assistance_selected', edited: 'assistance_edited', discarded: 'assistance_discarded' } as const;
    await this.analytics.record(accountId, events[input.action], input.suggestionId, { capability: input.capability });
  }
}
