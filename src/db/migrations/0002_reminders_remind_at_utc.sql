ALTER TABLE "reminders" ADD COLUMN "remind_at" timestamp with time zone;--> statement-breakpoint
UPDATE "reminders" SET "remind_at" = ("date"::timestamp AT TIME ZONE 'UTC') + CASE "time_of_day"
	WHEN 'morning' THEN interval '9 hours'
	WHEN 'afternoon' THEN interval '14 hours'
	ELSE interval '18 hours'
END;--> statement-breakpoint
ALTER TABLE "reminders" ALTER COLUMN "remind_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "reminders" DROP COLUMN "date";--> statement-breakpoint
ALTER TABLE "reminders" DROP COLUMN "time_of_day";--> statement-breakpoint
CREATE INDEX "reminders_remind_at_idx" ON "reminders" USING btree ("remind_at");--> statement-breakpoint
DROP TYPE "public"."time_of_day";
