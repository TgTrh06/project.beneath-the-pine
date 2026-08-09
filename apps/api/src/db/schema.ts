import { boolean, date, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const memberStatus = pgEnum("member_status", ["waitlisted", "active", "revoked"]);
export const taskStatus = pgEnum("task_status", ["ready", "done", "deferred", "archived"]);
export const energyLevel = pgEnum("energy_level", ["low", "medium", "high"]);

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  displayName: varchar("display_name", { length: 80 }),
  timezone: varchar("timezone", { length: 64 }).notNull().default("Asia/Ho_Chi_Minh"),
  onboardingCompletedAt: timestamp("onboarding_completed_at", { withTimezone: true }),
  ...timestamps,
});

export const waitlistEntries = pgTable("waitlist_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  name: varchar("name", { length: 80 }),
  context: varchar("context", { length: 500 }),
  status: memberStatus("status").notNull().default("waitlisted"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  approvedBy: uuid("approved_by"),
  ...timestamps,
}, (table) => [uniqueIndex("waitlist_email_unique").on(table.email)]);

export const betaMembers = pgTable("beta_members", {
  userId: uuid("user_id").primaryKey().references(() => profiles.id, { onDelete: "cascade" }),
  status: memberStatus("status").notNull().default("waitlisted"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  approvedBy: uuid("approved_by"),
  ...timestamps,
});

export const roles = pgTable("roles", {
  userId: uuid("user_id").primaryKey().references(() => profiles.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 20 }).notNull().default("member"),
  ...timestamps,
});

export const consents = pgTable("consents", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  aiProcessing: boolean("ai_processing").notNull(),
  contentRetention: boolean("content_retention").notNull(),
  researchAnalytics: boolean("research_analytics").notNull().default(false),
  version: varchar("version", { length: 32 }).notNull().default("2026-08-beta"),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  ...timestamps,
});

export const brainDumps = pgTable("brain_dumps", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  ciphertext: text("ciphertext").notNull(),
  iv: varchar("iv", { length: 64 }).notNull(),
  keyVersion: varchar("key_version", { length: 40 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ...timestamps,
});

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 280 }).notNull(),
  minutes: integer("minutes").notNull().default(10),
  status: taskStatus("status").notNull().default("ready"),
  sourceBrainDumpId: uuid("source_brain_dump_id").references(() => brainDumps.id, { onDelete: "set null" }),
  ...timestamps,
});

export const nextActions = pgTable("next_actions", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 280 }).notNull(),
  minutes: integer("minutes").notNull(),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  ...timestamps,
});

export const focusSessions = pgTable("focus_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "set null" }),
  plannedMinutes: integer("planned_minutes").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  outcome: varchar("outcome", { length: 20 }),
});

export const dailyResets = pgTable("daily_resets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  energy: energyLevel("energy").notNull(),
  availableMinutes: integer("available_minutes").notNull(),
  ...timestamps,
});

export const habits = pgTable("habits", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 100 }).notNull(),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  ...timestamps,
});
export const habitCompletions = pgTable("habit_completions", {
  id: uuid("id").defaultRandom().primaryKey(),
  habitId: uuid("habit_id").notNull().references(() => habits.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  completedOn: date("completed_on").notNull(),
  ...timestamps,
}, (table) => [uniqueIndex("habit_completion_once_per_day").on(table.habitId, table.completedOn)]);

export const checkins = pgTable("checkins", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  energy: energyLevel("energy").notNull(),
  ciphertext: text("ciphertext"),
  iv: varchar("iv", { length: 64 }),
  keyVersion: varchar("key_version", { length: 40 }),
  ...timestamps,
});

export const weeklyReviews = pgTable("weekly_reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  weekStart: date("week_start").notNull(),
  facts: jsonb("facts").notNull(),
  summary: text("summary"),
  insight: text("insight"),
  ...timestamps,
});
export const experiments = pgTable("experiments", {
  id: uuid("id").defaultRandom().primaryKey(),
  reviewId: uuid("review_id").notNull().references(() => weeklyReviews.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 160 }).notNull(),
  why: varchar("why", { length: 280 }).notNull(),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  ...timestamps,
});

export const aiUsage = pgTable("ai_usage", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  kind: varchar("kind", { length: 32 }).notNull(),
  weekStart: date("week_start").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
export const productEvents = pgTable("product_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => profiles.id, { onDelete: "set null" }),
  name: varchar("name", { length: 64 }).notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
});
