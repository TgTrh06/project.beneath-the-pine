import { Controller, Get, Inject, Post, Req, Header } from '@nestjs/common';
import type { Request } from 'express';
import { assistanceToolRequestSchema, type AssistanceToolsConfig } from '@pyneath/contracts';
import { body, principal } from '../../../platform/http/request';
import { API_CONFIG, type ApiConfig } from '../../../platform/config/api-config';
import { BusinessError } from '../../../shared/kernel/business-error';
import { AssistanceService } from '../application/assistance.service';
import { AssistanceContext } from '../infrastructure/assistance-context';

@Controller('api/v1/me/assistance/tools')
export class AssistanceToolsController {
  constructor(@Inject(API_CONFIG) private readonly config: ApiConfig, private readonly context: AssistanceContext,
    private readonly assistance: AssistanceService) {}
  @Get('config')
  configuration(@Req() req: Request): AssistanceToolsConfig {
    principal(req);
    const enabled = ['gemini', 'openrouter'].includes(this.config.API_ASSISTANCE_PROVIDER) && this.assistance.configuration().enabled;
    return { enabled, provider: this.config.API_ASSISTANCE_PROVIDER, tools: enabled ? ['get_current_focus_context', 'get_my_open_seed'] : [] };
  }
  @Get('context')
  @Header('Cache-Control', 'no-store')
  preview(@Req() req: Request) {
    const actor = principal(req);
    if (!this.configuration(req).enabled) throw new BusinessError('NOT_FOUND');
    return this.context.preview(actor.id);
  }
  @Post()
  suggest(@Req() req: Request) {
    const actor = principal(req);
    if (!this.configuration(req).enabled) throw new BusinessError('NOT_FOUND');
    const input = body(assistanceToolRequestSchema, req);
    return this.assistance.suggest(actor.id, input.request, input.grants);
  }
}
