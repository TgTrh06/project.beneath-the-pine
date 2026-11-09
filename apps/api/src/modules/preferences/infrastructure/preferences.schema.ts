import { boolean, check, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { accounts } from '../../identity/infrastructure/identity.schema';

export const accountPreferences = pgTable('account_preferences', {
  accountId: uuid('account_id').primaryKey().references(() => accounts.id, { onDelete: 'cascade' }),
  sharePresence: boolean('share_presence').notNull().default(false),
  remindAcceptedPacts: boolean('remind_accepted_pacts').notNull().default(false),
  presetDurationMinutes: integer('preset_duration_minutes'),
  presetSoundscapeId: text('preset_soundscape_id'),
  forestLayout: text('forest_layout').notNull().default('clearing'),
  forestHidden: integer('forest_hidden').array().notNull().default(sql`'{}'::integer[]`),
  forestVersion: integer('forest_version').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  check('account_preferences_forest_layout_check', sql`${table.forestLayout} IN ('clearing', 'gathered', 'arc')`),
  check('account_preferences_forest_hidden_check', sql`${table.forestHidden} <@ ARRAY[1,3,7] AND cardinality(${table.forestHidden}) <= 3 AND array_position(${table.forestHidden}, NULL) IS NULL`),
  check('account_preferences_forest_version_check', sql`${table.forestVersion} >= 0`),
]);
