import { BusinessError } from '../../../shared/kernel/business-error';
import type { Clock } from '../../../shared/kernel/clock';
import { validTimezone, type ProfileUpdate } from '../domain/profile';
import type { ProfileAccess, ProfileRepository } from './profile.ports';
export class ProfileService implements ProfileAccess {
  constructor(private readonly repository: ProfileRepository, private readonly clock: Clock) {}
  get(accountId: string) { return this.repository.get(accountId); }
  async update(accountId: string, input: ProfileUpdate) {
    if (input.timezone && !validTimezone(input.timezone)) throw new BusinessError('VALIDATION_FAILED');
    const current = await this.get(accountId);
    return this.repository.save({ accountId,
      displayName: input.displayName === undefined ? current?.displayName ?? null : input.displayName,
      timezone: input.timezone ?? current?.timezone ?? 'UTC', updatedAt: this.clock.now(),
    });
  }
}
