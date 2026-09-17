import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { accounts } from '../../identity/public-api';

export const openSeeds = pgTable('open_seeds', {
  accountId: uuid('account_id').primaryKey().references(() => accounts.id, { onDelete: 'cascade' }), id: uuid('id').notNull().defaultRandom().unique(),
  text: text('text').notNull(), sourceSessionId: uuid('source_session_id'), createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
