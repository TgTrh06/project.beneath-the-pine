import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { accounts } from '../../identity/public-api';

export const profiles = pgTable('profiles', {
  accountId: uuid('account_id').primaryKey().references(() => accounts.id, { onDelete: 'cascade' }),
  displayName: text('display_name'),
  timezone: text('timezone').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
