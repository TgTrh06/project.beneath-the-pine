CREATE TABLE "research_enrollments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE cascade,
  "participant_code" varchar(24) NOT NULL,
  "sequence" varchar(32) NOT NULL,
  "consented_at" timestamp with time zone DEFAULT now() NOT NULL,
  "withdrawn_at" timestamp with time zone,
  "retention_until" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "research_enrollment_user_unique" ON "research_enrollments" USING btree ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "research_enrollment_code_unique" ON "research_enrollments" USING btree ("participant_code");
--> statement-breakpoint
CREATE TABLE "research_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "enrollment_id" uuid NOT NULL REFERENCES "research_enrollments"("id") ON DELETE cascade,
  "condition" varchar(20) NOT NULL,
  "stuck_at" timestamp with time zone DEFAULT now() NOT NULL,
  "started_at" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "friction_before" integer NOT NULL,
  "friction_after" integer,
  "focus_outcome" varchar(20),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "research_enrollments" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "research_sessions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "research_enrollment_owner" ON "research_enrollments" FOR ALL USING ("user_id" = auth.uid()) WITH CHECK ("user_id" = auth.uid());
--> statement-breakpoint
CREATE POLICY "research_session_owner" ON "research_sessions" FOR ALL USING (EXISTS (SELECT 1 FROM "research_enrollments" WHERE "research_enrollments"."id" = "research_sessions"."enrollment_id" AND "research_enrollments"."user_id" = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM "research_enrollments" WHERE "research_enrollments"."id" = "research_sessions"."enrollment_id" AND "research_enrollments"."user_id" = auth.uid()));
