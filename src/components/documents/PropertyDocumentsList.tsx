"use client";

import { useTranslations } from "next-intl";
import type { DocumentMeta } from "@/types/property-document";
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";
import { FileText, ChevronRight, Loader2 } from "lucide-react";

type PropertyDocumentsListProps = {
  documents: DocumentMeta[];
  onDownload: (docId: string) => void;
  downloadingId?: string | null;
  error?: string | null;
};

function formatFileSize(bytes: number | null): string {
  if (bytes === null || bytes === undefined) return "";
  if (bytes < 1_000_000) return `${(bytes / 1_000).toFixed(0)} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

const KIND_KEYS: Record<string, string> = {
  offering: "docKindOffering",
  financial: "docKindFinancial",
  legal: "docKindLegal",
  other: "docKindOther",
};

export function PropertyDocumentsList({
  documents,
  onDownload,
  downloadingId,
  error,
}: PropertyDocumentsListProps) {
  const t = useTranslations("property");
  return (
    <section>
      <h2 className="px-1 text-[0.9375rem] font-semibold text-foreground">
        {t("documents")}
      </h2>
      <Block>
        {error && (
          <Row>
            <span className="text-destructive text-sm">{error}</span>
          </Row>
        )}
        {documents.map((doc) => (
          <Row
            key={doc.id}
            onClick={() => onDownload(doc.id)}
            aria-label={t("downloadDoc", { title: doc.title })}
          >
            <FileText className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-sm font-medium text-foreground">
                {doc.title}
              </span>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded bg-secondary px-1.5 py-0.5 text-[0.625rem] font-medium uppercase tracking-wider">
                  {t(KIND_KEYS[doc.kind] ?? "docKindOther")}
                </span>
                {formatFileSize(doc.fileSize) && (
                  <span>{formatFileSize(doc.fileSize)}</span>
                )}
              </span>
            </div>
            {downloadingId === doc.id ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            )}
          </Row>
        ))}
        {documents.length === 0 && !error && (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            {t("documentsEmpty")}
          </div>
        )}
      </Block>
    </section>
  );
}
