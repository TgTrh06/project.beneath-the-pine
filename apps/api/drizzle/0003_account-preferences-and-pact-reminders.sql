CREATE TABLE "pact_reminder_receipts" (
	"pact_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"claimed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pact_reminder_receipts_pact_id_account_id_pk" PRIMARY KEY("pact_id","account_id")
);
--> statement-breakpoint
CREATE TABLE "account_preferences" (
	"account_id" uuid PRIMARY KEY NOT NULL,
	"share_presence" boolean DEFAULT false NOT NULL,
	"remind_accepted_pacts" boolean DEFAULT false NOT NULL,
	"preset_duration_minutes" integer,
	"preset_soundscape_id" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pact_reminder_receipts" ADD CONSTRAINT "pact_reminder_receipts_pact_id_focus_pacts_id_fk" FOREIGN KEY ("pact_id") REFERENCES "public"."focus_pacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pact_reminder_receipts" ADD CONSTRAINT "pact_reminder_receipts_account_id_identity_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."identity_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_preferences" ADD CONSTRAINT "account_preferences_account_id_identity_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."identity_accounts"("id") ON DELETE cascade ON UPDATE no action;