CREATE TABLE "auth_codes" (
	"hash" text PRIMARY KEY NOT NULL,
	"client" text NOT NULL,
	"connection" text NOT NULL,
	"redirect" text NOT NULL,
	"challenge" text NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"client" text NOT NULL,
	"redirect" text NOT NULL,
	"challenge" text NOT NULL,
	"state" text,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "connections" (
	"id" text PRIMARY KEY NOT NULL,
	"client" text NOT NULL,
	"name" text NOT NULL,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"used" timestamp with time zone,
	"revoked" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "oauth_clients" (
	"id" text PRIMARY KEY NOT NULL,
	"info" jsonb NOT NULL,
	"fetched" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tokens" (
	"hash" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"client" text NOT NULL,
	"connection" text NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auth_codes" ADD CONSTRAINT "auth_codes_connection_connections_id_fk" FOREIGN KEY ("connection") REFERENCES "public"."connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_connection_connections_id_fk" FOREIGN KEY ("connection") REFERENCES "public"."connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tokens_connection" ON "tokens" USING btree ("connection");