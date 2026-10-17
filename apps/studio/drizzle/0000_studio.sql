CREATE TABLE "entries" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"project" text NOT NULL,
	"stack" text NOT NULL,
	"ord" integer NOT NULL,
	"draft" jsonb NOT NULL,
	"author" text NOT NULL,
	"label" text NOT NULL,
	"at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marks" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"project" text NOT NULL,
	"author" text NOT NULL,
	"target" text NOT NULL,
	"label" text NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"project" text NOT NULL,
	"id" integer NOT NULL,
	"note" jsonb NOT NULL,
	CONSTRAINT "notes_project_id_pk" PRIMARY KEY("project","id")
);
--> statement-breakpoint
CREATE TABLE "photos" (
	"project" text NOT NULL,
	"file" text NOT NULL,
	"bytes" "bytea" NOT NULL,
	CONSTRAINT "photos_project_file_pk" PRIMARY KEY("project","file")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"created" text NOT NULL,
	"updated" text NOT NULL,
	"revision" integer NOT NULL,
	"version" integer NOT NULL,
	"goals" jsonb NOT NULL,
	"reference" jsonb
);
--> statement-breakpoint
CREATE TABLE "receipts" (
	"project" text NOT NULL,
	"key" text NOT NULL,
	"receipt" jsonb NOT NULL,
	CONSTRAINT "receipts_project_key_pk" PRIMARY KEY("project","key")
);
--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_project_projects_id_fk" FOREIGN KEY ("project") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marks" ADD CONSTRAINT "marks_project_projects_id_fk" FOREIGN KEY ("project") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_project_projects_id_fk" FOREIGN KEY ("project") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photos" ADD CONSTRAINT "photos_project_projects_id_fk" FOREIGN KEY ("project") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_project_projects_id_fk" FOREIGN KEY ("project") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "entries_project" ON "entries" USING btree ("project","stack","ord");--> statement-breakpoint
CREATE INDEX "marks_project" ON "marks" USING btree ("project");