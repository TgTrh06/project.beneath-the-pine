ALTER TYPE "public"."circle_role" RENAME TO "camp_role";--> statement-breakpoint
ALTER TYPE "public"."circle_status" RENAME TO "camp_status";--> statement-breakpoint
ALTER TYPE "public"."circle_invite_status" RENAME TO "camp_invite_status";--> statement-breakpoint
ALTER TYPE "public"."circle_milestone_type" RENAME TO "camp_milestone_type";--> statement-breakpoint
ALTER TABLE "circle_invite_declines" RENAME TO "camp_invite_declines";--> statement-breakpoint
ALTER TABLE "circle_invites" RENAME TO "camp_invites";--> statement-breakpoint
ALTER TABLE "circle_memberships" RENAME TO "camp_memberships";--> statement-breakpoint
ALTER TABLE "circles" RENAME TO "camps";--> statement-breakpoint
ALTER TABLE "circle_milestones" RENAME TO "camp_milestones";--> statement-breakpoint
ALTER TABLE "camp_invites" RENAME COLUMN "circle_id" TO "camp_id";--> statement-breakpoint
ALTER TABLE "camp_memberships" RENAME COLUMN "circle_id" TO "camp_id";--> statement-breakpoint
ALTER TABLE "focus_sessions" RENAME COLUMN "circle_id" TO "camp_id";--> statement-breakpoint
ALTER TABLE "camp_milestones" RENAME COLUMN "circle_id" TO "camp_id";--> statement-breakpoint
ALTER TABLE "focus_pacts" RENAME COLUMN "circle_id" TO "camp_id";--> statement-breakpoint
ALTER TABLE "camp_invites" RENAME CONSTRAINT "circle_invites_token_hash_unique" TO "camp_invites_token_hash_unique";--> statement-breakpoint
ALTER TABLE "camp_invite_declines" RENAME CONSTRAINT "circle_invite_declines_invite_id_account_id_pk" TO "camp_invite_declines_invite_id_account_id_pk";--> statement-breakpoint
ALTER TABLE "camp_invite_declines" RENAME CONSTRAINT "circle_invite_declines_invite_id_circle_invites_id_fk" TO "camp_invite_declines_invite_id_camp_invites_id_fk";--> statement-breakpoint
ALTER TABLE "camp_invite_declines" RENAME CONSTRAINT "circle_invite_declines_account_id_identity_accounts_id_fk" TO "camp_invite_declines_account_id_identity_accounts_id_fk";--> statement-breakpoint
ALTER TABLE "camp_invites" RENAME CONSTRAINT "circle_invites_circle_id_circles_id_fk" TO "camp_invites_camp_id_camps_id_fk";--> statement-breakpoint
ALTER TABLE "camp_invites" RENAME CONSTRAINT "circle_invites_created_by_account_id_identity_accounts_id_fk" TO "camp_invites_created_by_account_id_identity_accounts_id_fk";--> statement-breakpoint
ALTER TABLE "camp_invites" RENAME CONSTRAINT "circle_invites_accepted_by_account_id_identity_accounts_id_fk" TO "camp_invites_accepted_by_account_id_identity_accounts_id_fk";--> statement-breakpoint
ALTER TABLE "camp_memberships" RENAME CONSTRAINT "circle_memberships_circle_id_circles_id_fk" TO "camp_memberships_camp_id_camps_id_fk";--> statement-breakpoint
ALTER TABLE "camp_memberships" RENAME CONSTRAINT "circle_memberships_account_id_identity_accounts_id_fk" TO "camp_memberships_account_id_identity_accounts_id_fk";--> statement-breakpoint
ALTER TABLE "camps" RENAME CONSTRAINT "circles_owner_account_id_identity_accounts_id_fk" TO "camps_owner_account_id_identity_accounts_id_fk";--> statement-breakpoint
ALTER TABLE "focus_sessions" RENAME CONSTRAINT "focus_sessions_circle_id_circles_id_fk" TO "focus_sessions_camp_id_camps_id_fk";--> statement-breakpoint
ALTER TABLE "camp_milestones" RENAME CONSTRAINT "circle_milestones_circle_id_circles_id_fk" TO "camp_milestones_camp_id_camps_id_fk";--> statement-breakpoint
ALTER TABLE "focus_pacts" RENAME CONSTRAINT "focus_pacts_circle_id_circles_id_fk" TO "focus_pacts_camp_id_camps_id_fk";--> statement-breakpoint
ALTER INDEX "circle_invite_declines_account_idx" RENAME TO "camp_invite_declines_account_idx";--> statement-breakpoint
ALTER INDEX "circle_invites_circle_idx" RENAME TO "camp_invites_camp_idx";--> statement-breakpoint
ALTER INDEX "circle_memberships_circle_account_uq" RENAME TO "camp_memberships_camp_account_uq";--> statement-breakpoint
ALTER INDEX "circle_memberships_account_idx" RENAME TO "camp_memberships_account_idx";--> statement-breakpoint
ALTER INDEX "circles_owner_idx" RENAME TO "camps_owner_idx";--> statement-breakpoint
ALTER INDEX "circle_milestones_session_type_uq" RENAME TO "camp_milestones_session_type_uq";--> statement-breakpoint
ALTER INDEX "focus_pacts_circle_idx" RENAME TO "focus_pacts_camp_idx";--> statement-breakpoint
UPDATE "product_events" SET "name" = CASE "name"
  WHEN 'circle_created' THEN 'camp_created'
  WHEN 'circle_invite_accepted' THEN 'camp_invite_accepted'
  WHEN 'circle_milestone_recorded' THEN 'camp_milestone_recorded'
  ELSE "name" END
WHERE "name" IN ('circle_created', 'circle_invite_accepted', 'circle_milestone_recorded');
