import { pgEnum, pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { circles } from '../../circle/public-api';
export const milestoneType = pgEnum('circle_milestone_type', ['shared_presence']);
export const circleMilestones = pgTable('circle_milestones', { id: uuid('id').defaultRandom().primaryKey(), circleId: uuid('circle_id').notNull().references(() => circles.id, { onDelete: 'cascade' }), sessionId: uuid('session_id').notNull(), type: milestoneType('type').notNull().default('shared_presence'), recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow() }, table => [uniqueIndex('circle_milestones_session_type_uq').on(table.sessionId, table.type)]);
