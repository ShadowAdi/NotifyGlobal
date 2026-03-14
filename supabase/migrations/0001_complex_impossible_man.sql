ALTER TABLE "campaigns" DROP CONSTRAINT "campaigns_event_id_events_id_fk";
--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "template_id" uuid;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "subject" text;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "message" text;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "channel" text DEFAULT 'email' NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "filter_type" text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "filter_language" text;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "filter_tags" jsonb;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "contact_ids" jsonb;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "tags" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password" text NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" DROP COLUMN "event_id";