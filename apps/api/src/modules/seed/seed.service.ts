import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DatabaseService } from '../../platform/database/database.service';
import { openSeeds } from './infrastructure/seed.schema';
@Injectable()
export class SeedService {
  constructor(private readonly database: DatabaseService) {}
  async get(accountId: string) { return (await this.database.db.select().from(openSeeds).where(eq(openSeeds.accountId, accountId)))[0] ?? null; }
  async upsert(accountId: string, input: { text: string; sourceSessionId?: string | null }) { const now = new Date(); return (await this.database.db.insert(openSeeds).values({ accountId, text: input.text, sourceSessionId: input.sourceSessionId ?? null }).onConflictDoUpdate({ target: openSeeds.accountId, set: { text: input.text, sourceSessionId: input.sourceSessionId ?? null, updatedAt: now } }).returning())[0]; }
  async remove(accountId: string) { await this.database.db.delete(openSeeds).where(eq(openSeeds.accountId, accountId)); }
}
