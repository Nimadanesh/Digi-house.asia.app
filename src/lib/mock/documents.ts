import type { DocumentsRepo } from "@/lib/api/repos";
import { MOCK_DOCUMENTS } from "./seed/documents";
import { sleep, jitter } from "./sleep";

export function MockDocumentsRepo(): DocumentsRepo {
  return {
    async list(propertyId: string) {
      await sleep(jitter());
      // Return same docs for any property (mock mode)
      if (propertyId === "never") return [];
      return MOCK_DOCUMENTS;
    },
    async getDownloadUrl(propertyId: string, docId: string) {
      await sleep(jitter());
      return {
        url: `https://media.example.com/documents/${propertyId}/${docId}.pdf?X-Amz-Signature=mock`,
        publicUrl: `https://media.example.com/documents/${propertyId}/${docId}.pdf`,
        expiresAt: new Date(Date.now() + 900_000).toISOString(),
      };
    },
  };
}
