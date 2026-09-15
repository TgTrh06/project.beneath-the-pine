CREATE TYPE "public"."account_role" AS ENUM('wanderer', 'pine_keeper');--> statement-breakpoint
CREATE TABLE "identity_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "account_role" DEFAULT 'wanderer' NOT NULL,
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
ALTER TABLE "identity_sessions" ADD CONSTRAINT "identity_sessions_account_id_identity_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."identity_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "identity_sessions_expiry_idx" ON "identity_sessions" USING btree ("expires_at");