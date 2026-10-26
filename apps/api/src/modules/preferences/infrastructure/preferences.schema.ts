import { boolean, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { accounts } from '../../identity/public-api';

export const accountPreferences = pgTable('account_preferences', {
  accountId: uuid('account_id').primaryKey().references(() => accounts.id, { onDelete: 'cascade' }),
  sharePresence: boolean('share_presence').notNull().default(false),
  remindAcceptedPacts: boolean('remind_accepted_pacts').notNull().default(false),
  presetDurationMinutes: integer('preset_duration_minutes'),
  presetSoundscapeId: text('preset_soundscape_id'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
