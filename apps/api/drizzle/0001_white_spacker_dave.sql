CREATE TABLE "circle_invite_declines" (
	"invite_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"declined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "circle_invite_declines_invite_id_account_id_pk" PRIMARY KEY("invite_id","account_id")
);
--> statement-breakpoint
ALTER TABLE "circle_invite_declines" ADD CONSTRAINT "circle_invite_declines_invite_id_circle_invites_id_fk" FOREIGN KEY ("invite_id") REFERENCES "public"."circle_invites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "circle_invite_declines" ADD CONSTRAINT "circle_invite_declines_account_id_identity_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."identity_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "circle_invite_declines_account_idx" ON "circle_invite_declines" USING btree ("account_id");