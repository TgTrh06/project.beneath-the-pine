import { pgTable, pgEnum, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';

export const accountRole = pgEnum('account_role', ['wanderer', 'pine_keeper']);
export const accounts = pgTable('identity_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: accountRole('role').notNull().default('wanderer'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
export const sessions = pgTable('identity_sessions', {
  tokenHash: text('token_hash').primaryKey(),
  accountId: uuid('account_id').references(() => accounts.id, { onDelete: 'cascade' }),
  csrfToken: text('csrf_token').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
}, table => [index('identity_sessions_expiry_idx').on(table.expiresAt)]);
