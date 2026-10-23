CREATE TABLE "openai_identities" (
	"issuer" text NOT NULL,
	"client" text NOT NULL,
	"subject" text NOT NULL,
	"owner" text NOT NULL,
	CONSTRAINT "openai_identities_issuer_client_subject_pk" PRIMARY KEY("issuer","client","subject")
);
--> statement-breakpoint
CREATE TABLE "openai_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"state" text NOT NULL,
	"nonce" text NOT NULL,
	"verifier" text NOT NULL,
	"next" text NOT NULL,
	"owner" text,
	"expires" timestamp with time zone NOT NULL
);
