import { Controller, Get, Patch, Req } from '@nestjs/common';
import type { Request } from 'express';
import { updateProfileSchema } from '@beneath-the-pine/contracts';
import { body, principal } from '../../platform/http/request';
import { ProfileService } from './profile.service';

@Controller('api/v1/me/profile')
export class ProfileController {
  constructor(private readonly profiles: ProfileService) {}
  @Get() async get(@Req() request: Request) { return { profile: await this.profiles.get(principal(request).id) }; }
  @Patch() async update(@Req() request: Request) { return { profile: await this.profiles.update(principal(request).id, body(updateProfileSchema, request)) }; }
}
