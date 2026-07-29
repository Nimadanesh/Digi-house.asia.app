export type DocumentMeta = {
  id: string;
  title: string;
  kind: "legal" | "financial" | "offering" | "other";
  fileSize: number | null;
  createdAt: string;
};

export type DocumentDownloadUrl = {
  url: string;
  publicUrl?: string;
  expiresAt: string;
};
