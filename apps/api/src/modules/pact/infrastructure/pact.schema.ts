import { index, integer, pgEnum, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { accounts } from '../../identity/public-api';
import { camps } from '../../camp/public-api';

export const pactStatus = pgEnum('pact_status', ['scheduled', 'active', 'completed', 'cancelled', 'expired']);
export const pactResponse = pgEnum('pact_response', ['invited', 'accepted', 'declined']);
export const focusPacts = pgTable('focus_pacts', {
  id: uuid('id').defaultRandom().primaryKey(), campId: uuid('camp_id').notNull().references(() => camps.id, { onDelete: 'cascade' }),
  creatorAccountId: uuid('creator_account_id').references(() => accounts.id, { onDelete: 'set null' }), startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  durationMinutes: integer('duration_minutes').notNull(), status: pactStatus('status').notNull().default('scheduled'), startedSessionId: uuid('started_session_id'),
  requestKey: text('request_key').notNull(), createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [uniqueIndex('focus_pacts_creator_request_uq').on(table.creatorAccountId, table.requestKey), index('focus_pacts_camp_idx').on(table.campId)]);
export const focusPactParticipants = pgTable('focus_pact_participants', {
  id: uuid('id').defaultRandom().primaryKey(), pactId: uuid('pact_id').notNull().references(() => focusPacts.id, { onDelete: 'cascade' }),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }), response: pactResponse('response').notNull().default('invited'),
  respondedAt: timestamp('responded_at', { withTimezone: true }), createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [uniqueIndex('focus_pact_participants_pact_account_uq').on(table.pactId, table.accountId), index('focus_pact_participants_account_idx').on(table.accountId)]);

export const pactReminderReceipts = pgTable('pact_reminder_receipts', {
  pactId: uuid('pact_id').notNull().references(() => focusPacts.id, { onDelete: 'cascade' }),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  claimedAt: timestamp('claimed_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [primaryKey({ columns: [table.pactId, table.accountId] })]);
