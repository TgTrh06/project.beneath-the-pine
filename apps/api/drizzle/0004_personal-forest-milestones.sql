CREATE TABLE "personal_milestones" (
	"account_id" uuid NOT NULL,
	"threshold" integer NOT NULL,
	"source_session_id" uuid NOT NULL,
	"recorded_at" timestamp with time zone NOT NULL,
	CONSTRAINT "personal_milestones_account_id_threshold_pk" PRIMARY KEY("account_id","threshold"),
	CONSTRAINT "personal_milestones_threshold_check" CHECK ("personal_milestones"."threshold" IN (1, 3, 7))
);
--> statement-breakpoint
ALTER TABLE "personal_milestones" ADD CONSTRAINT "personal_milestones_account_id_identity_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."identity_accounts"("id") ON DELETE cascade ON UPDATE no action;