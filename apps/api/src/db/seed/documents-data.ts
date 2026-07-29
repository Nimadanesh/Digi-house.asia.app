import type { NewPropertyDocumentRow } from "../schema/property-documents.js";

export const SEED_DOCUMENTS: NewPropertyDocumentRow[] = [
  {
    id: "doc-om-001",
    propertyId: "prop-marina-vista-4b",
    title: "Offering Memorandum",
    kind: "offering",
    storageKey: "documents/prop-marina-vista-4b/om.pdf",
    fileSize: 2_400_000,
    contentType: "application/pdf",
    createdAt: new Date("2026-06-15"),
  },
  {
    id: "doc-fin-q2-001",
    propertyId: "prop-marina-vista-4b",
    title: "Financial Statement Q2 2026",
    kind: "financial",
    storageKey: "documents/prop-marina-vista-4b/fin-q2-2026.pdf",
    fileSize: 1_100_000,
    contentType: "application/pdf",
    createdAt: new Date("2026-07-01"),
  },
  {
    id: "doc-lease-001",
    propertyId: "prop-marina-vista-4b",
    title: "Tenant Lease Agreement",
    kind: "legal",
    storageKey: "documents/prop-marina-vista-4b/lease.pdf",
    fileSize: 800_000,
    contentType: "application/pdf",
    createdAt: new Date("2026-05-20"),
  },
];
