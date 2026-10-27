import { Controller, HttpCode, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { assistanceInteractionSchema, assistanceRequestSchema } from '@pyneath/contracts';
import { body, principal } from '../../platform/http/request';
import { AssistanceService } from './assistance.service';

@Controller('api/v1/me/assistance')
export class AssistanceController {
  constructor(private readonly assistance: AssistanceService) { }

  @Post()
  async suggest(@Req() request: Request) {
    return this.assistance.suggest(principal(request).id, body(assistanceRequestSchema, request));
  }

  @Post('interactions')
  @HttpCode(204)
  async interaction(@Req() request: Request): Promise<void> {
    await this.assistance.interaction(principal(request).id, body(assistanceInteractionSchema, request));
  }
}
