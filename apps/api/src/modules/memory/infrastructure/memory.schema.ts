import { sql } from 'drizzle-orm';
import { check, integer, pgEnum, pgTable, primaryKey, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { camps } from '../../camp/infrastructure/camp.schema';
import { accounts } from '../../identity/infrastructure/identity.schema';

export const milestoneType = pgEnum('camp_milestone_type', ['shared_presence']);
export const campMilestones = pgTable('camp_milestones', {
    id: uuid('id').defaultRandom().primaryKey(),
    campId: uuid('camp_id').notNull().references(() => camps.id, { onDelete: 'cascade' }),
    sessionId: uuid('session_id').notNull(),
    type: milestoneType('type').notNull().default('shared_presence'),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow()
}, table => [uniqueIndex('camp_milestones_session_type_uq').on(table.sessionId, table.type)]);

export const personalMilestones = pgTable('personal_milestones', {
    accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
    threshold: integer('threshold').notNull(),
    // Preserve the memory independently of session retention; never include work text.
    sourceSessionId: uuid('source_session_id').notNull(),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull(),
}, table => [
    primaryKey({ columns: [table.accountId, table.threshold] }),
    check('personal_milestones_threshold_check', sql`${table.threshold} IN (1, 3, 7)`),
]);
