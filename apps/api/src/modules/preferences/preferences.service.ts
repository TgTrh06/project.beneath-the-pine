import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { defaultForestArrangement, forestArrangementSchema, type ForestArrangement, type Preferences, type UpdatePreferences } from '@pyneath/contracts';
import { eq } from 'drizzle-orm';
import { Subject } from 'rxjs';
import { DatabaseService } from '../../platform/database/database.service';
import { accountPreferences } from './infrastructure/preferences.schema';
import { accounts } from '../identity/public-api';
import { personalMilestones } from '../memory/public-api';

const defaults: Preferences = { sharePresence: false, remindAcceptedPacts: false, focusPreset: null, forestArrangement: defaultForestArrangement };

@Injectable()
export class PreferencesService {
  readonly presenceSharingChanges = new Subject<string>();
  constructor(private readonly database: DatabaseService) {}

  async get(accountId: string): Promise<Preferences> {
    const [row] = await this.database.db.select().from(accountPreferences)
      .where(eq(accountPreferences.accountId, accountId));
    return row ? this.project(row) : { ...defaults };
  }

  async update(accountId: string, patch: UpdatePreferences): Promise<Preferences> {
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

  async arrangeForest(accountId: string, input: ForestArrangement): Promise<ForestArrangement> {
    const patch = forestArrangementSchema.parse(input);
    return this.database.db.transaction(async tx => {
      // Same owner lock as memory projection; also serializes first-write races and deletion.
      const [owner] = await tx.select({ id: accounts.id }).from(accounts).where(eq(accounts.id, accountId)).for('update');
      if (!owner) throw new NotFoundException();
      const [current] = await tx.select().from(accountPreferences).where(eq(accountPreferences.accountId, accountId));
      if ((current?.forestVersion ?? 0) !== patch.version) throw new ConflictException({ code: 'forest_version_conflict', message: 'Forest arrangement changed.' });
      const earned = await tx.select({ threshold: personalMilestones.threshold }).from(personalMilestones).where(eq(personalMilestones.accountId, accountId));
      if (patch.hidden.some(threshold => !earned.some(item => item.threshold === threshold))) throw new ForbiddenException();
      const values = { forestLayout: patch.layout, forestHidden: [...patch.hidden].sort((a, b) => a - b), forestVersion: patch.version + 1 };
      const [saved] = await tx.insert(accountPreferences).values({ accountId, ...values }).onConflictDoUpdate({
        target: accountPreferences.accountId, set: { ...values, updatedAt: new Date() },
      }).returning();
      return this.project(saved).forestArrangement;
    });
  }

  private project(row: typeof accountPreferences.$inferSelect): Preferences {
    return {
      sharePresence: row.sharePresence,
      remindAcceptedPacts: row.remindAcceptedPacts,
      forestArrangement: { layout: row.forestLayout as ForestArrangement['layout'], hidden: row.forestHidden as ForestArrangement['hidden'], version: row.forestVersion },
      focusPreset: row.presetDurationMinutes === null ? null : {
        durationMinutes: row.presetDurationMinutes as 5 | 10 | 25 | 50,
        soundscapeId: row.presetSoundscapeId as 'rain' | 'forest' | 'stream' | null,
      },
    };
  }
}
