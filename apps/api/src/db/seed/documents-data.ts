import type { NewPropertyDocumentRow } from "../schema/property-documents.js";

export const SEED_DOCUMENTS: NewPropertyDocumentRow[] = [
  {
    id: "doc-om-001",
    propertyId: "re-128862",
    title: "Offering Memorandum",
    kind: "offering",
    storageKey: "documents/re-128862/om.pdf",
    fileSize: 2_400_000,
    contentType: "application/pdf",
    createdAt: new Date("2026-06-15"),
  },
  {
    id: "doc-fin-q2-001",
    propertyId: "re-128862",
    title: "Financial Statement Q2 2026",
    kind: "financial",
    storageKey: "documents/re-128862/fin-q2-2026.pdf",
    fileSize: 1_100_000,
    contentType: "application/pdf",
    createdAt: new Date("2026-07-01"),
  },
  {
    id: "doc-lease-001",
    propertyId: "re-128862",
    title: "Tenant Lease Agreement",
    kind: "legal",
    storageKey: "documents/re-128862/lease.pdf",
    fileSize: 800_000,
    contentType: "application/pdf",
    createdAt: new Date("2026-05-20"),
  },
];
