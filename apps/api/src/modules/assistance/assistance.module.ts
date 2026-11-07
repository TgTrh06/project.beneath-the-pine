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

@Module({
  imports: [AnalyticsModule],
  controllers: [AssistanceController],
  providers: [
    { provide: AssistanceService, inject: [API_CONFIG, ASSISTANCE_PROVIDER, ANALYTICS],
      useFactory: (config: ApiConfig, provider: AssistanceProvider, analytics: Analytics) => new AssistanceService(assistanceConfiguration(config), provider, analytics) },
    OpenAiAssistanceProvider,
    LocalAssistanceProvider,
    { provide: ASSISTANCE_PROVIDER, inject: [API_CONFIG, OpenAiAssistanceProvider, LocalAssistanceProvider], useFactory: (config: ApiConfig, openai: OpenAiAssistanceProvider, local: LocalAssistanceProvider) => config.API_ASSISTANCE_PROVIDER === 'local' ? local : config.API_ASSISTANCE_PROVIDER === 'openai' ? openai : { generate: async () => { throw new Error('Assistance disabled'); } } }
  ]
})
export class AssistanceModule { }
