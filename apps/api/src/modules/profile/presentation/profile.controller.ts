import { Controller, Get, Inject, Patch, Req } from '@nestjs/common';
import type { Request } from 'express';
import { updateProfileSchema } from '@pyneath/contracts';
import { body, principal } from '../../../platform/http/request';
import { PROFILE_ACCESS, type ProfileAccess } from '../application/profile.ports';

@Controller('api/v1/me/profile')
export class ProfileController {
  constructor(@Inject(PROFILE_ACCESS) private readonly profiles: ProfileAccess) { }

  @Get()
  async get(@Req() request: Request) {
    return {
      profile: await this.profiles.get(principal(request).id)
    };
  }

  @Patch()
  async update(@Req() request: Request) {
    return {
      profile: await this.profiles.update(
        principal(request).id,
        body(updateProfileSchema, request)
      )
    };
  }
}
