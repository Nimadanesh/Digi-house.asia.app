import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { properties } from "./properties.js";

export const propertyDocuments = pgTable("property_documents", {
  id: text("id").primaryKey(),
  propertyId: text("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  kind: text("kind").notNull(),
  storageKey: text("storage_key").notNull(),
  fileSize: integer("file_size"),
  contentType: text("content_type"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PropertyDocumentRow = typeof propertyDocuments.$inferSelect;
export type NewPropertyDocumentRow = typeof propertyDocuments.$inferInsert;
