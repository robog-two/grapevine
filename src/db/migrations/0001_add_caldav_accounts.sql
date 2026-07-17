CREATE TABLE "caldav_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"server_url_enc" text NOT NULL,
	"account_enc" text NOT NULL,
	"password_enc" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "caldav_accounts" ADD CONSTRAINT "caldav_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "caldav_accounts_user_idx" ON "caldav_accounts" USING btree ("user_id");