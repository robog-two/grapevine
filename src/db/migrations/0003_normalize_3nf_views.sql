ALTER TABLE "mentions" DROP CONSTRAINT "mentions_source_person_id_people_id_fk";
--> statement-breakpoint
ALTER TABLE "reminders" DROP CONSTRAINT "reminders_person_id_people_id_fk";
--> statement-breakpoint
ALTER TABLE "timeline_events" DROP CONSTRAINT "timeline_events_user_id_users_id_fk";
--> statement-breakpoint
DROP INDEX "custom_field_values_pair_idx";--> statement-breakpoint
DROP INDEX "mentions_source_idx";--> statement-breakpoint
DROP INDEX "people_cabinets_pair_idx";--> statement-breakpoint
DROP INDEX "reminders_item_idx";--> statement-breakpoint
ALTER TABLE "custom_field_values" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "mentions" DROP COLUMN "source_person_id";--> statement-breakpoint
ALTER TABLE "people_cabinets" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "reminders" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "reminders" ADD PRIMARY KEY ("item_id");--> statement-breakpoint
ALTER TABLE "custom_field_values" ADD CONSTRAINT "custom_field_values_person_id_field_id_pk" PRIMARY KEY("person_id","field_id");--> statement-breakpoint
ALTER TABLE "people_cabinets" ADD CONSTRAINT "people_cabinets_person_id_cabinet_id_pk" PRIMARY KEY("person_id","cabinet_id");--> statement-breakpoint
CREATE INDEX "mentions_source_item_idx" ON "mentions" USING btree ("source_item_id");--> statement-breakpoint
ALTER TABLE "reminders" DROP COLUMN "person_id";--> statement-breakpoint
ALTER TABLE "reminders" DROP COLUMN "note_enc";--> statement-breakpoint
ALTER TABLE "reminders" DROP COLUMN "ical_uid";--> statement-breakpoint
ALTER TABLE "share_links" DROP COLUMN "scope";--> statement-breakpoint
ALTER TABLE "timeline_events" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_target_check" CHECK (("share_links"."person_id" IS NULL) <> ("share_links"."cabinet_id" IS NULL));--> statement-breakpoint
CREATE VIEW "public"."active_items" AS (select "items"."id", "items"."person_id", "people"."user_id", "items"."type", "items"."pos_x", "items"."pos_y", "items"."sort_index", "items"."content_enc", "items"."blob_url", "items"."created_at", "items"."updated_at" from "items" inner join "people" on "people"."id" = "items"."person_id" where "items"."deleted_at" is null);--> statement-breakpoint
CREATE VIEW "public"."cabinet_members" AS (select "people_cabinets"."cabinet_id", "people_cabinets"."person_id", "people"."user_id", "people"."name_enc", "people"."icon_key", "people_cabinets"."pos_x", "people_cabinets"."pos_y" from "people_cabinets" inner join "people" on "people"."id" = "people_cabinets"."person_id" where "people"."deleted_at" is null);--> statement-breakpoint
CREATE VIEW "public"."mention_edges" AS (select "mentions"."id", "mentions"."source_item_id", "items"."person_id" as "source_person_id", "mentions"."target_person_id", "people"."user_id", "mentions"."context_snippet_enc" from "mentions" inner join "items" on "items"."id" = "mentions"."source_item_id" inner join "people" on "people"."id" = "items"."person_id" where "items"."deleted_at" is null);--> statement-breakpoint
CREATE VIEW "public"."people_directory" AS (select "people"."id", "people"."user_id", "people"."name_enc", "people"."icon_key", "people"."created_at", "people"."updated_at", "people_cabinets"."cabinet_id", "cabinets"."name_enc" as "cabinet_name_enc" from "people" left join "people_cabinets" on "people_cabinets"."person_id" = "people"."id" left join "cabinets" on "cabinets"."id" = "people_cabinets"."cabinet_id" where "people"."deleted_at" is null);--> statement-breakpoint
CREATE VIEW "public"."reminder_feed" AS (select "reminders"."item_id", "items"."person_id", "people"."user_id", "reminders"."remind_at", "items"."content_enc", "people"."name_enc", "reminders"."item_id"::text || '@grapevine.app' as "ical_uid" from "reminders" inner join "items" on "items"."id" = "reminders"."item_id" inner join "people" on "people"."id" = "items"."person_id" where "items"."deleted_at" is null);--> statement-breakpoint
CREATE VIEW "public"."share_link_details" AS (select "id", "user_id", case when "person_id" is not null then 'person' else 'cabinet' end as "scope", "person_id", "cabinet_id", "token", "snapshot_enc", "revoked", "created_at" from "share_links");--> statement-breakpoint
CREATE VIEW "public"."timeline_feed" AS (select "timeline_events"."id", "timeline_events"."person_id", "people"."user_id", "timeline_events"."item_id", "timeline_events"."change_type", "timeline_events"."label_enc", "timeline_events"."snapshot_enc", "timeline_events"."created_at" from "timeline_events" inner join "people" on "people"."id" = "timeline_events"."person_id");--> statement-breakpoint
CREATE VIEW "public"."trashed_items" AS (select "items"."id", "items"."person_id", "people"."user_id", "items"."type", "items"."content_enc", "people"."name_enc", "items"."deleted_at" from "items" inner join "people" on "people"."id" = "items"."person_id" where "items"."deleted_at" is not null);--> statement-breakpoint
DROP TYPE "public"."share_scope";