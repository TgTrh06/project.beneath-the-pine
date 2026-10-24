import { Module } from '@nestjs/common';
import { API_CONFIG, type ApiConfig } from '../../platform/config/api-config';
import { AnalyticsModule } from '../analytics/analytics.module';
import { ASSISTANCE_PROVIDER, OpenAiAssistanceProvider } from './assistance.provider';
import { AssistanceService } from './assistance.service';
import { AssistanceController } from './assistance.controller';

@Module({
  imports: [AnalyticsModule],
  controllers: [AssistanceController],
  providers: [
    AssistanceService,
    OpenAiAssistanceProvider,
    { provide: ASSISTANCE_PROVIDER, inject: [API_CONFIG, OpenAiAssistanceProvider], useFactory: (config: ApiConfig, openai: OpenAiAssistanceProvider) => config.API_ASSISTANCE_PROVIDER === 'openai' ? openai : { generate: async () => { throw new Error('Assistance disabled'); } } }
  ]
})
export class AssistanceModule { }
