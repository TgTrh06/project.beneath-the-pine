import { BadRequestException, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DatabaseService } from '../../platform/database/database.service';
import { validTimezone } from '../../platform/http/request';
import { profiles } from './infrastructure/profile.schema';

@Injectable()
export class ProfileService {
  constructor(private readonly database: DatabaseService) {}
  async get(accountId: string) {
    return (await this.database.db.select().from(profiles).where(eq(profiles.accountId, accountId)))[0] ?? null;
  }
  async update(accountId: string, input: { displayName?: string | null; timezone?: string }) {
    if (input.timezone && !validTimezone(input.timezone)) throw new BadRequestException();
    const current = await this.get(accountId);
    const value = { displayName: input.displayName === undefined ? current?.displayName ?? null : input.displayName, timezone: input.timezone ?? current?.timezone ?? 'UTC', updatedAt: new Date() };
    return (await this.database.db.insert(profiles).values({ accountId, ...value }).onConflictDoUpdate({ target: profiles.accountId, set: value }).returning())[0];
  }
}
