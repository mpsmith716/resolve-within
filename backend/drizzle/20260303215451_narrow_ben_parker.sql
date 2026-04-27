ALTER TABLE "daily_messages" ADD COLUMN "date" date NOT NULL;--> statement-breakpoint
ALTER TABLE "daily_messages" DROP COLUMN "is_active";