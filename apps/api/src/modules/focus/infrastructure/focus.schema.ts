import { index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { accounts } from '../../identity/public-api';
import { circles } from '../../circle/public-api';

export const focusKind = pgEnum('focus_session_kind', ['solo', 'pact']);
export const focusStatus = pgEnum('focus_session_status', ['active', 'completed', 'cancelled']);
export const participantPresence = pgEnum('participant_presence', ['active', 'break', 'disconnected', 'checked_out']);
export const checkoutOutcome = pgEnum('checkout_outcome', ['completed', 'progress', 'stuck', 'stopped']);
export const focusSessions = pgTable('focus_sessions', {
  id: uuid('id').defaultRandom().primaryKey(), kind: focusKind('kind').notNull(), pactId: uuid('pact_id').unique(), circleId: uuid('circle_id').references(() => circles.id, { onDelete: 'set null' }),
  startedByAccountId: uuid('started_by_account_id').references(() => accounts.id, { onDelete: 'set null' }), durationMinutes: integer('duration_minutes').notNull(),
  status: focusStatus('status').notNull().default('active'), startedAt: timestamp('started_at', { withTimezone: true }).notNull(), endsAt: timestamp('ends_at', { withTimezone: true }).notNull(), completedAt: timestamp('completed_at', { withTimezone: true }), requestKey: text('request_key').notNull(),
}, table => [uniqueIndex('focus_sessions_actor_request_uq').on(table.startedByAccountId, table.requestKey), index('focus_sessions_active_ends_idx').on(table.status, table.endsAt)]);
export const sessionParticipants = pgTable('session_participants', {
  id: uuid('id').defaultRandom().primaryKey(), sessionId: uuid('session_id').notNull().references(() => focusSessions.id, { onDelete: 'cascade' }), accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  activeSlotAccountId: uuid('active_slot_account_id').references(() => accounts.id, { onDelete: 'cascade' }), intention: text('intention'), presence: participantPresence('presence').notNull().default('active'), outcome: checkoutOutcome('outcome'),
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(), checkedOutAt: timestamp('checked_out_at', { withTimezone: true }),
}, table => [uniqueIndex('session_participants_session_account_uq').on(table.sessionId, table.accountId), uniqueIndex('session_participants_one_active_per_account_uq').on(table.activeSlotAccountId), index('session_participants_account_idx').on(table.accountId)]);
