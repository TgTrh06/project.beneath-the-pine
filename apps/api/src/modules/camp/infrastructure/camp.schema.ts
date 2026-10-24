import { index, pgEnum, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { accounts } from '../../identity/public-api';

export const campStatus = pgEnum('camp_status', ['active', 'archived']);
export const campRole = pgEnum('camp_role', ['owner', 'member']);
export const membershipStatus = pgEnum('membership_status', ['active', 'removed']);
export const inviteStatus = pgEnum('camp_invite_status', ['pending', 'accepted', 'revoked', 'expired']);
export const camps = pgTable('camps', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerAccountId: uuid('owner_account_id').notNull().references(() => accounts.id, { onDelete: 'restrict' }),
  name: text('name').notNull(), status: campStatus('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [index('camps_owner_idx').on(table.ownerAccountId)]);
export const campMemberships = pgTable('camp_memberships', {
  id: uuid('id').defaultRandom().primaryKey(), campId: uuid('camp_id').notNull().references(() => camps.id, { onDelete: 'cascade' }),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }), role: campRole('role').notNull(),
  status: membershipStatus('status').notNull().default('active'), joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(), removedAt: timestamp('removed_at', { withTimezone: true }),
}, table => [uniqueIndex('camp_memberships_camp_account_uq').on(table.campId, table.accountId), index('camp_memberships_account_idx').on(table.accountId)]);
export const campInvites = pgTable('camp_invites', {
  id: uuid('id').defaultRandom().primaryKey(), campId: uuid('camp_id').notNull().references(() => camps.id, { onDelete: 'cascade' }),
  createdByAccountId: uuid('created_by_account_id').references(() => accounts.id, { onDelete: 'set null' }), tokenHash: text('token_hash').notNull().unique(),
  status: inviteStatus('status').notNull().default('pending'), expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  acceptedByAccountId: uuid('accepted_by_account_id').references(() => accounts.id, { onDelete: 'set null' }), createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(), acceptedAt: timestamp('accepted_at', { withTimezone: true }),
}, table => [index('camp_invites_camp_idx').on(table.campId)]);

export const campInviteDeclines = pgTable('camp_invite_declines', {
  inviteId: uuid('invite_id').notNull().references(() => campInvites.id, { onDelete: 'cascade' }),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  declinedAt: timestamp('declined_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [primaryKey({ columns: [table.inviteId, table.accountId] }), index('camp_invite_declines_account_idx').on(table.accountId)]);
