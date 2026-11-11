import { Module } from '@nestjs/common';
import { API_CONFIG, type ApiConfig } from '../../platform/config/api-config';
import { AnalyticsModule } from '../analytics/analytics.module';
import { ASSISTANCE_PROVIDER, type AssistanceProvider } from './application/assistance-provider';
import { OpenAiAssistanceProvider } from './infrastructure/openai-assistance.provider';
import { AssistanceService } from './application/assistance.service';
import { AssistanceController } from './presentation/assistance.controller';
import { LocalAssistanceProvider } from './infrastructure/local-assistance.provider';
import { assistanceConfiguration } from './infrastructure/assistance-configuration';
import { ANALYTICS, type Analytics } from '../analytics/public-api';
import { GeminiAssistanceProvider } from './infrastructure/gemini-assistance.provider';
import { GeminiHttpTransport } from './infrastructure/gemini-http';
import { OpenRouterAssistanceProvider } from './infrastructure/openrouter-assistance.provider';
import { OpenRouterHttpTransport } from './infrastructure/openrouter-http';
import { AssistanceContext } from './infrastructure/assistance-context';
import { FocusModule } from '../focus/focus.module';
import { SeedModule } from '../seed/seed.module';
import { AssistanceToolsController } from './presentation/assistance-tools.controller';

@Module({
  imports: [AnalyticsModule, FocusModule, SeedModule],
  controllers: [AssistanceController, AssistanceToolsController],
  providers: [
    AssistanceContext, GeminiAssistanceProvider, GeminiHttpTransport, OpenRouterAssistanceProvider, OpenRouterHttpTransport,
    { provide: AssistanceService, inject: [API_CONFIG, ASSISTANCE_PROVIDER, ANALYTICS, AssistanceContext],
      useFactory: (config: ApiConfig, provider: AssistanceProvider, analytics: Analytics, context: AssistanceContext) => new AssistanceService(assistanceConfiguration(config), provider, analytics, ['gemini', 'openrouter'].includes(config.API_ASSISTANCE_PROVIDER) ? context : undefined) },
    OpenAiAssistanceProvider,
    LocalAssistanceProvider,
    { provide: ASSISTANCE_PROVIDER, inject: [API_CONFIG, OpenAiAssistanceProvider, LocalAssistanceProvider, GeminiAssistanceProvider, OpenRouterAssistanceProvider], useFactory: (config: ApiConfig, openai: OpenAiAssistanceProvider, local: LocalAssistanceProvider, gemini: GeminiAssistanceProvider, openrouter: OpenRouterAssistanceProvider) => config.API_ASSISTANCE_PROVIDER === 'openrouter' ? openrouter : config.API_ASSISTANCE_PROVIDER === 'gemini' ? gemini : config.API_ASSISTANCE_PROVIDER === 'local' ? local : config.API_ASSISTANCE_PROVIDER === 'openai' ? openai : { generate: async () => { throw new Error('Assistance disabled'); } } }
  ]
})
export class AssistanceModule { }
