import { Controller, Get, Patch, Req } from '@nestjs/common';
import type { Request } from 'express';
import { forestArrangementSchema, updatePreferencesSchema } from '@pyneath/contracts';
import { body, principal } from '../../platform/http/request';
import { PreferencesService } from './preferences.service';

@Controller('api/v1/me/preferences')
export class PreferencesController {
  constructor(private readonly preferences: PreferencesService) {}

  @Get()
  async get(@Req() request: Request) {
    return { preferences: await this.preferences.get(principal(request).id) };
  }

  @Patch()
  async update(@Req() request: Request) {
    return { preferences: await this.preferences.update(
      principal(request).id,
      body(updatePreferencesSchema, request),
    ) };
  }

  @Patch('forest')
  async arrangeForest(@Req() request: Request) {
    return { forestArrangement: await this.preferences.arrangeForest(principal(request).id, body(forestArrangementSchema, request)) };
  }
}
