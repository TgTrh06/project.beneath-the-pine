import { index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { accounts } from '../../identity/public-api';
import { circles } from '../../circle/public-api';

export const pactStatus = pgEnum('pact_status', ['scheduled', 'active', 'completed', 'cancelled', 'expired']);
export const pactResponse = pgEnum('pact_response', ['invited', 'accepted', 'declined']);
export const focusPacts = pgTable('focus_pacts', {
  id: uuid('id').defaultRandom().primaryKey(), circleId: uuid('circle_id').notNull().references(() => circles.id, { onDelete: 'cascade' }),
  creatorAccountId: uuid('creator_account_id').references(() => accounts.id, { onDelete: 'set null' }), startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  durationMinutes: integer('duration_minutes').notNull(), status: pactStatus('status').notNull().default('scheduled'), startedSessionId: uuid('started_session_id'),
  requestKey: text('request_key').notNull(), createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [uniqueIndex('focus_pacts_creator_request_uq').on(table.creatorAccountId, table.requestKey), index('focus_pacts_circle_idx').on(table.circleId)]);
export const focusPactParticipants = pgTable('focus_pact_participants', {
  id: uuid('id').defaultRandom().primaryKey(), pactId: uuid('pact_id').notNull().references(() => focusPacts.id, { onDelete: 'cascade' }),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }), response: pactResponse('response').notNull().default('invited'),
  respondedAt: timestamp('responded_at', { withTimezone: true }), createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [uniqueIndex('focus_pact_participants_pact_account_uq').on(table.pactId, table.accountId), index('focus_pact_participants_account_idx').on(table.accountId)]);
