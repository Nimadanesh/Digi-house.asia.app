import { desc, eq } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { propertyDocuments } from "../db/schema/property-documents.js";

export type DocumentMeta = {
  id: string;
  propertyId: string;
  title: string;
  kind: "legal" | "financial" | "offering" | "other";
  fileSize: number | null;
  createdAt: string;
};

export type DocumentRecord = DocumentMeta & {
  storageKey: string;
  contentType: string | null;
};

function mapRow(r: {
  id: string; propertyId: string; title: string; kind: string;
  fileSize: number | null; createdAt: Date; storageKey: string; contentType: string | null;
}): DocumentRecord {
  return {
    id: r.id,
    propertyId: r.propertyId,
    title: r.title,
    kind: r.kind as DocumentMeta["kind"],
    fileSize: r.fileSize,
    createdAt: r.createdAt.toISOString(),
    storageKey: r.storageKey,
    contentType: r.contentType,
  };
}

function toMeta(r: DocumentRecord): DocumentMeta {
  return {
    id: r.id,
    propertyId: r.propertyId,
    title: r.title,
    kind: r.kind,
    fileSize: r.fileSize,
    createdAt: r.createdAt,
  };
}

export type DocumentStore = {
  listByProperty(propertyId: string): Promise<DocumentMeta[]>;
  getById(docId: string): Promise<DocumentRecord | null>;
};

export function createDbDocumentStore(db: Db): DocumentStore {
  return {
    async listByProperty(propertyId) {
      const rows = await db
        .select()
        .from(propertyDocuments)
        .where(eq(propertyDocuments.propertyId, propertyId))
        .orderBy(desc(propertyDocuments.createdAt));
      return rows.map(mapRow).map(toMeta);
    },

    async getById(docId) {
      const rows = await db
        .select()
        .from(propertyDocuments)
        .where(eq(propertyDocuments.id, docId))
        .limit(1);
      const row = rows[0];
      return row ? mapRow(row) : null;
    },
  };
}

export function createMemoryDocumentStore(
  seed: DocumentRecord[],
): DocumentStore & { _rows: DocumentRecord[] } {
  const rows = seed.map((r) => ({ ...r }));

  return {
    _rows: rows,

    async listByProperty(propertyId) {
      return rows
        .filter((r) => r.propertyId === propertyId || propertyId === "all")
        .map(toMeta);
    },

    async getById(docId) {
      const row = rows.find((r) => r.id === docId);
      return row ?? null;
    },
  };
}
