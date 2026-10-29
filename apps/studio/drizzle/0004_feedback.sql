CREATE TABLE "feedback_contacts" (
	"report" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback_counters" (
	"key" text PRIMARY KEY NOT NULL,
	"value" integer NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback_events" (
	"id" text PRIMARY KEY NOT NULL,
	"report" text,
	"author" text NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"kind" text NOT NULL,
	"detail" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback_receipts" (
	"id" text PRIMARY KEY NOT NULL,
	"secret" text NOT NULL,
	"content" text NOT NULL,
	"report" text NOT NULL,
	"state" text NOT NULL,
	"image_key" text,
	"bytes" integer DEFAULT 0 NOT NULL,
	"quotas" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"lease" timestamp with time zone NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone DEFAULT now() NOT NULL,
	"category" text NOT NULL,
	"message" text NOT NULL,
	"context" jsonb NOT NULL,
	"snapshot" jsonb,
	"image_key" text,
	"image_bytes" integer DEFAULT 0 NOT NULL,
	"payload_bytes" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"moderation" text DEFAULT 'inbox' NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"issue_group" text DEFAULT '' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	"evidence_expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"paused" integer DEFAULT 0 NOT NULL,
	"attachments_paused" integer DEFAULT 0 NOT NULL,
	"cleanup_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "feedback_contacts" ADD CONSTRAINT "feedback_contacts_report_feedback_reports_id_fk" FOREIGN KEY ("report") REFERENCES "public"."feedback_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_events" ADD CONSTRAINT "feedback_events_report_feedback_reports_id_fk" FOREIGN KEY ("report") REFERENCES "public"."feedback_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "feedback_inbox" ON "feedback_reports" USING btree ("moderation","status","created");--> statement-breakpoint
CREATE INDEX "feedback_pattern" ON "feedback_reports" USING btree (("context"->>'pattern'),"created");--> statement-breakpoint
CREATE INDEX "feedback_group" ON "feedback_reports" USING btree ("issue_group");--> statement-breakpoint
CREATE INDEX "feedback_expiry" ON "feedback_reports" USING btree ("expires");--> statement-breakpoint
CREATE INDEX "feedback_evidence_expiry" ON "feedback_reports" USING btree ("evidence_expires");