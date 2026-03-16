ALTER TABLE "events" ALTER COLUMN "template_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "variables" jsonb;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "subject" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "message" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "channel" text DEFAULT 'email' NOT NULL;