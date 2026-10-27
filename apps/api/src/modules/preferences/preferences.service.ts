import { Injectable } from '@nestjs/common';
import type { Preferences } from '@pyneath/contracts';
import { eq } from 'drizzle-orm';
import { Subject } from 'rxjs';
import { DatabaseService } from '../../platform/database/database.service';
import { accountPreferences } from './infrastructure/preferences.schema';

const defaults: Preferences = { sharePresence: false, remindAcceptedPacts: false, focusPreset: null };

@Injectable()
export class PreferencesService {
  readonly presenceSharingChanges = new Subject<string>();
  constructor(private readonly database: DatabaseService) {}

  async get(accountId: string): Promise<Preferences> {
    const [row] = await this.database.db.select().from(accountPreferences)
      .where(eq(accountPreferences.accountId, accountId));
    return row ? this.project(row) : { ...defaults };
  }

  async update(accountId: string, patch: Partial<Preferences>): Promise<Preferences> {
    const values = {
      accountId,
      ...(patch.sharePresence !== undefined ? { sharePresence: patch.sharePresence } : {}),
      ...(patch.remindAcceptedPacts !== undefined ? { remindAcceptedPacts: patch.remindAcceptedPacts } : {}),
      ...(patch.focusPreset !== undefined ? {
        presetDurationMinutes: patch.focusPreset?.durationMinutes ?? null,
        presetSoundscapeId: patch.focusPreset?.soundscapeId ?? null,
      } : {}),
    };
    const [saved] = await this.database.db.insert(accountPreferences).values(values).onConflictDoUpdate({
      target: accountPreferences.accountId,
      set: {
        ...(patch.sharePresence !== undefined ? { sharePresence: patch.sharePresence } : {}),
        ...(patch.remindAcceptedPacts !== undefined ? { remindAcceptedPacts: patch.remindAcceptedPacts } : {}),
        ...(patch.focusPreset !== undefined ? {
          presetDurationMinutes: patch.focusPreset?.durationMinutes ?? null,
          presetSoundscapeId: patch.focusPreset?.soundscapeId ?? null,
        } : {}),
        updatedAt: new Date(),
      },
    }).returning();
    if (patch.sharePresence !== undefined) this.presenceSharingChanges.next(accountId);
    return this.project(saved);
  }

  private project(row: typeof accountPreferences.$inferSelect): Preferences {
    return {
      sharePresence: row.sharePresence,
      remindAcceptedPacts: row.remindAcceptedPacts,
      focusPreset: row.presetDurationMinutes === null ? null : {
        durationMinutes: row.presetDurationMinutes as 5 | 10 | 25 | 50,
        soundscapeId: row.presetSoundscapeId as 'rain' | 'forest' | 'stream' | null,
      },
    };
  }
}
