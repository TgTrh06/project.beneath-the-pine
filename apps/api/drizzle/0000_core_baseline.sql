CREATE TYPE "public"."circle_role" AS ENUM('owner', 'member');--> statement-breakpoint
CREATE TYPE "public"."circle_status" AS ENUM('active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."circle_invite_status" AS ENUM('pending', 'accepted', 'revoked', 'expired');--> statement-breakpoint
CREATE TYPE "public"."membership_status" AS ENUM('active', 'removed');--> statement-breakpoint
CREATE TYPE "public"."checkout_outcome" AS ENUM('completed', 'progress', 'stuck', 'stopped');--> statement-breakpoint
CREATE TYPE "public"."focus_session_kind" AS ENUM('solo', 'pact');--> statement-breakpoint
CREATE TYPE "public"."focus_session_status" AS ENUM('active', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."participant_presence" AS ENUM('active', 'break', 'disconnected', 'checked_out');--> statement-breakpoint
CREATE TYPE "public"."circle_milestone_type" AS ENUM('shared_presence');--> statement-breakpoint
CREATE TYPE "public"."pact_response" AS ENUM('invited', 'accepted', 'declined');--> statement-breakpoint
CREATE TYPE "public"."pact_status" AS ENUM('scheduled', 'active', 'completed', 'cancelled', 'expired');--> statement-breakpoint
CREATE TABLE "product_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid,
	"name" text NOT NULL,
	"subject_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "circle_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"circle_id" uuid NOT NULL,
	"created_by_account_id" uuid,
	"token_hash" text NOT NULL,
	"status" "circle_invite_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_by_account_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"accepted_at" timestamp with time zone,
	CONSTRAINT "circle_invites_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "circle_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"circle_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"role" "circle_role" NOT NULL,
	"status" "membership_status" DEFAULT 'active' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"removed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "circles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_account_id" uuid NOT NULL,
	"name" text NOT NULL,
	"status" "circle_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "focus_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "focus_session_kind" NOT NULL,
	"pact_id" uuid,
	"circle_id" uuid,
	"started_by_account_id" uuid,
	"duration_minutes" integer NOT NULL,
	"status" "focus_session_status" DEFAULT 'active' NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"request_key" text NOT NULL,
	CONSTRAINT "focus_sessions_pact_id_unique" UNIQUE("pact_id")
);
--> statement-breakpoint
CREATE TABLE "session_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"active_slot_account_id" uuid,
	"intention" text,
	"presence" "participant_presence" DEFAULT 'active' NOT NULL,
	"outcome" "checkout_outcome",
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"checked_out_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "identity_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "identity_accounts_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "identity_sessions" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"account_id" uuid,
	"csrf_token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "circle_milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"circle_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"type" "circle_milestone_type" DEFAULT 'shared_presence' NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "focus_pact_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pact_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"response" "pact_response" DEFAULT 'invited' NOT NULL,
	"responded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "focus_pacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"circle_id" uuid NOT NULL,
	"creator_account_id" uuid,
	"starts_at" timestamp with time zone NOT NULL,
	"duration_minutes" integer NOT NULL,
	"status" "pact_status" DEFAULT 'scheduled' NOT NULL,
	"started_session_id" uuid,
	"request_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"account_id" uuid PRIMARY KEY NOT NULL,
	"display_name" text,
	"timezone" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "open_seeds" (
	"account_id" uuid PRIMARY KEY NOT NULL,
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"text" text NOT NULL,
	"source_session_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "open_seeds_id_unique" UNIQUE("id")
);
--> statement-breakpoint
ALTER TABLE "product_events" ADD CONSTRAINT "product_events_account_id_identity_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."identity_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "circle_invites" ADD CONSTRAINT "circle_invites_circle_id_circles_id_fk" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "circle_invites" ADD CONSTRAINT "circle_invites_created_by_account_id_identity_accounts_id_fk" FOREIGN KEY ("created_by_account_id") REFERENCES "public"."identity_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "circle_invites" ADD CONSTRAINT "circle_invites_accepted_by_account_id_identity_accounts_id_fk" FOREIGN KEY ("accepted_by_account_id") REFERENCES "public"."identity_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "circle_memberships" ADD CONSTRAINT "circle_memberships_circle_id_circles_id_fk" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "circle_memberships" ADD CONSTRAINT "circle_memberships_account_id_identity_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."identity_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "circles" ADD CONSTRAINT "circles_owner_account_id_identity_accounts_id_fk" FOREIGN KEY ("owner_account_id") REFERENCES "public"."identity_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "focus_sessions" ADD CONSTRAINT "focus_sessions_circle_id_circles_id_fk" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "focus_sessions" ADD CONSTRAINT "focus_sessions_started_by_account_id_identity_accounts_id_fk" FOREIGN KEY ("started_by_account_id") REFERENCES "public"."identity_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_participants" ADD CONSTRAINT "session_participants_session_id_focus_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."focus_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_participants" ADD CONSTRAINT "session_participants_account_id_identity_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."identity_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_participants" ADD CONSTRAINT "session_participants_active_slot_account_id_identity_accounts_id_fk" FOREIGN KEY ("active_slot_account_id") REFERENCES "public"."identity_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity_sessions" ADD CONSTRAINT "identity_sessions_account_id_identity_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."identity_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "circle_milestones" ADD CONSTRAINT "circle_milestones_circle_id_circles_id_fk" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "focus_pact_participants" ADD CONSTRAINT "focus_pact_participants_pact_id_focus_pacts_id_fk" FOREIGN KEY ("pact_id") REFERENCES "public"."focus_pacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "focus_pact_participants" ADD CONSTRAINT "focus_pact_participants_account_id_identity_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."identity_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "focus_pacts" ADD CONSTRAINT "focus_pacts_circle_id_circles_id_fk" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "focus_pacts" ADD CONSTRAINT "focus_pacts_creator_account_id_identity_accounts_id_fk" FOREIGN KEY ("creator_account_id") REFERENCES "public"."identity_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_account_id_identity_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."identity_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "open_seeds" ADD CONSTRAINT "open_seeds_account_id_identity_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."identity_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_events_account_time_idx" ON "product_events" USING btree ("account_id","occurred_at");--> statement-breakpoint
CREATE INDEX "circle_invites_circle_idx" ON "circle_invites" USING btree ("circle_id");--> statement-breakpoint
CREATE UNIQUE INDEX "circle_memberships_circle_account_uq" ON "circle_memberships" USING btree ("circle_id","account_id");--> statement-breakpoint
CREATE INDEX "circle_memberships_account_idx" ON "circle_memberships" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "circles_owner_idx" ON "circles" USING btree ("owner_account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "focus_sessions_actor_request_uq" ON "focus_sessions" USING btree ("started_by_account_id","request_key");--> statement-breakpoint
CREATE INDEX "focus_sessions_active_ends_idx" ON "focus_sessions" USING btree ("status","ends_at");--> statement-breakpoint
CREATE UNIQUE INDEX "session_participants_session_account_uq" ON "session_participants" USING btree ("session_id","account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "session_participants_one_active_per_account_uq" ON "session_participants" USING btree ("active_slot_account_id");--> statement-breakpoint
CREATE INDEX "session_participants_account_idx" ON "session_participants" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "identity_sessions_expiry_idx" ON "identity_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "circle_milestones_session_type_uq" ON "circle_milestones" USING btree ("session_id","type");--> statement-breakpoint
CREATE UNIQUE INDEX "focus_pact_participants_pact_account_uq" ON "focus_pact_participants" USING btree ("pact_id","account_id");--> statement-breakpoint
CREATE INDEX "focus_pact_participants_account_idx" ON "focus_pact_participants" USING btree ("account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "focus_pacts_creator_request_uq" ON "focus_pacts" USING btree ("creator_account_id","request_key");--> statement-breakpoint
CREATE INDEX "focus_pacts_circle_idx" ON "focus_pacts" USING btree ("circle_id");