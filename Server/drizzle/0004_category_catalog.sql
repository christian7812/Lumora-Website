CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "categories_name_unique" UNIQUE("name")
);

--> statement-breakpoint
INSERT INTO "categories" ("name")
SELECT DISTINCT COALESCE(NULLIF(BTRIM("category"), ''), 'Uncategorized')
FROM "products"
ON CONFLICT ("name") DO NOTHING;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "category_id" uuid;--> statement-breakpoint
UPDATE "products" AS product
SET "category_id" = category."id"
FROM "categories" AS category
WHERE category."name" = COALESCE(NULLIF(BTRIM(product."category"), ''), 'Uncategorized');--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "category_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "products_category_id_idx" ON "products" USING btree ("category_id");--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "category";
