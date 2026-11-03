CREATE TABLE "telegram_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_key" text NOT NULL,
	"message" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp DEFAULT now() NOT NULL,
	"locked_at" timestamp,
	"processed_at" timestamp,
	"last_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "telegram_notifications_event_key_unique" UNIQUE("event_key"),
	CONSTRAINT "telegram_notifications_status_valid" CHECK ("telegram_notifications"."status" IN ('pending', 'processing', 'sent'))
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_reference" text;--> statement-breakpoint
CREATE INDEX "telegram_notifications_pending_idx" ON "telegram_notifications" USING btree ("status","next_attempt_at");