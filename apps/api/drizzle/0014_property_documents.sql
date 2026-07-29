CREATE TABLE "property_documents" (
  "id" text PRIMARY KEY NOT NULL,
  "property_id" text NOT NULL REFERENCES "properties"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "kind" text NOT NULL CHECK ("kind" IN ('legal', 'financial', 'offering', 'other')),
  "storage_key" text NOT NULL,
  "file_size" integer,
  "content_type" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "idx_documents_property_id" ON "property_documents" ("property_id");
