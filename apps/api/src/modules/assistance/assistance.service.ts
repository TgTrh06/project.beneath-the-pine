import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { assistanceResponseSchema, type AssistanceInteraction, type AssistanceRequest, type AssistanceResponse } from '@pyneath/contracts';
import { API_CONFIG, type ApiConfig } from '../../platform/config/api-config';
import { AnalyticsService } from '../analytics/public-api';
import { ASSISTANCE_PROVIDER, type AssistanceProvider } from './assistance.provider';

const boundaryWords = /(?:tự\s*(?:tử|sát)|muốn\s+chết|suicide|kill\s+myself|chẩn\s+đoán|đơn\s+thuốc|diagnos(?:e|is)|medication)/i;
const boundaryMessage = 'Pine không thể gợi ý công việc cho tình huống này. Hãy tìm sự hỗ trợ từ một người bạn tin cậy hoặc dịch vụ chuyên môn phù hợp.';
const fallbackMessage = 'Chưa thể tạo gợi ý. Nội dung bạn đã nhập vẫn ở đây; bạn có thể tự viết bước tiếp theo.';

@Injectable()
export class AssistanceService {
  constructor(
    @Inject(API_CONFIG) private readonly config: ApiConfig,
    @Inject(ASSISTANCE_PROVIDER) private readonly provider: AssistanceProvider,
    private readonly analytics: AnalyticsService
  ) { }

  private fallback(capability: AssistanceRequest['capability'], boundary: boolean): AssistanceResponse {
    return assistanceResponseSchema.parse({
      status: boundary ? 'boundary' : 'fallback',
      output: { capability, version: '1', needsHumanSupport: boundary, message: boundary ? boundaryMessage : fallbackMessage, fallback: boundary ? 'stop_and_return' : 'manual_step' }
    });
  }

  async suggest(accountId: string, input: AssistanceRequest): Promise<AssistanceResponse> {
    const text = input.capability === 'assisted_start' ? input.description : input.context;
    if (boundaryWords.test(text)) return this.fallback(input.capability, true);
    if (this.config.API_ASSISTANCE_PROVIDER !== 'openai' || !this.config.OPENAI_API_KEY) return this.fallback(input.capability, false);
    try {
      const suggestionId = await this.analytics.reserveAssistanceRequest(accountId, input.capability);
      if (!suggestionId) {
        await this.analytics.record(accountId, 'assistance_fallback', undefined, { capability: input.capability });
        return this.fallback(input.capability, false);
      }
      const result = await this.provider.generate(input);
      if (result.kind === 'boundary') return this.fallback(input.capability, true);
      const output = input.capability === 'assisted_start'
        ? { capability: input.capability, version: '1', needsHumanSupport: false, activationStep: result.text, estimatedMinutes: result.estimatedMinutes, fallback: 'manual_step' }
        : { capability: input.capability, version: '1', needsHumanSupport: false, openSeedDraft: result.text, fallback: 'manual_step' };
      return assistanceResponseSchema.parse({ status: 'suggestion', suggestionId, output });
    } catch {
      await this.analytics.record(accountId, 'assistance_fallback', undefined, { capability: input.capability });
      return this.fallback(input.capability, false);
    }
  }

  async interaction(accountId: string, input: AssistanceInteraction): Promise<void> {
    if (!await this.analytics.ownsAssistanceRequest(accountId, input.suggestionId, input.capability)) throw new NotFoundException();
    const events = { viewed: 'assistance_viewed', selected: 'assistance_selected', edited: 'assistance_edited', discarded: 'assistance_discarded' } as const;
    await this.analytics.record(accountId, events[input.action], input.suggestionId, { capability: input.capability });
  }
}
