import { Hono } from "hono";
import { requireSession } from "../auth/require-session.js";
import type { SessionConfig } from "../auth/session.js";
import type { UserStore } from "../auth/user-store.js";
import type { S3Signer } from "../lib/s3-sign.js";
import type { DocumentStore } from "../marketplace/document-store.js";

export type DocumentRouteDeps = {
  documents: DocumentStore;
  s3Signer: S3Signer | null;
  session: SessionConfig;
  users: UserStore;
};

export function createDocumentRoutes(deps: DocumentRouteDeps) {
  const app = new Hono();

  // Public: list document metadata
  app.get("/v1/properties/:id/documents", async (c) => {
    const id = c.req.param("id");
    if (!id?.trim()) {
      return c.json({ code: "not_found", message: "Property not found" }, 404);
    }
    const docs = await deps.documents.listByProperty(id);
    return c.json({ documents: docs });
  });

  // Auth required: get signed download URL
  app.get(
    "/v1/properties/:id/documents/:docId/url",
    requireSession({ session: deps.session, users: deps.users }),
    async (c) => {
      const id = c.req.param("id");
      const docId = c.req.param("docId");
      if (!id?.trim() || !docId?.trim()) {
        return c.json({ code: "not_found", message: "Document not found" }, 404);
      }

      const doc = await deps.documents.getById(docId);
      if (!doc || !doc.storageKey.startsWith(`documents/${id}/`)) {
        return c.json({ code: "not_found", message: "Document not found" }, 404);
      }

      if (!deps.s3Signer) {
        return c.json(
          { code: "not_configured", message: "Document download is not configured" },
          501,
        );
      }

      const { signedUrl, publicUrl } = deps.s3Signer.getSignedGetUrl(doc.storageKey);
      const expiresAt = new Date(Date.now() + 900_000).toISOString();

      return c.json({ url: signedUrl, publicUrl, expiresAt });
    },
  );

  return app;
}
