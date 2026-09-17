import { index, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { accounts } from '../../identity/public-api';

export const circleStatus = pgEnum('circle_status', ['active', 'archived']);
export const circleRole = pgEnum('circle_role', ['owner', 'member']);
export const membershipStatus = pgEnum('membership_status', ['active', 'removed']);
export const inviteStatus = pgEnum('circle_invite_status', ['pending', 'accepted', 'revoked', 'expired']);
export const circles = pgTable('circles', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerAccountId: uuid('owner_account_id').notNull().references(() => accounts.id, { onDelete: 'restrict' }),
  name: text('name').notNull(), status: circleStatus('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [index('circles_owner_idx').on(table.ownerAccountId)]);
export const circleMemberships = pgTable('circle_memberships', {
  id: uuid('id').defaultRandom().primaryKey(), circleId: uuid('circle_id').notNull().references(() => circles.id, { onDelete: 'cascade' }),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }), role: circleRole('role').notNull(),
  status: membershipStatus('status').notNull().default('active'), joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(), removedAt: timestamp('removed_at', { withTimezone: true }),
}, table => [uniqueIndex('circle_memberships_circle_account_uq').on(table.circleId, table.accountId), index('circle_memberships_account_idx').on(table.accountId)]);
export const circleInvites = pgTable('circle_invites', {
  id: uuid('id').defaultRandom().primaryKey(), circleId: uuid('circle_id').notNull().references(() => circles.id, { onDelete: 'cascade' }),
  createdByAccountId: uuid('created_by_account_id').references(() => accounts.id, { onDelete: 'set null' }), tokenHash: text('token_hash').notNull().unique(),
  status: inviteStatus('status').notNull().default('pending'), expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  acceptedByAccountId: uuid('accepted_by_account_id').references(() => accounts.id, { onDelete: 'set null' }), createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(), acceptedAt: timestamp('accepted_at', { withTimezone: true }),
}, table => [index('circle_invites_circle_idx').on(table.circleId)]);
