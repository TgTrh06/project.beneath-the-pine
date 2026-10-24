import { pgEnum, pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { camps } from '../../camp/public-api';

export const milestoneType = pgEnum('camp_milestone_type', ['shared_presence']);
export const campMilestones = pgTable('camp_milestones', {
    id: uuid('id').defaultRandom().primaryKey(),
    campId: uuid('camp_id').notNull().references(() => camps.id, { onDelete: 'cascade' }),
    sessionId: uuid('session_id').notNull(),
    type: milestoneType('type').notNull().default('shared_presence'),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow()
}, table => [uniqueIndex('camp_milestones_session_type_uq').on(table.sessionId, table.type)]);
