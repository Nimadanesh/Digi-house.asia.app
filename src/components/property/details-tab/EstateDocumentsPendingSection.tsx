"use client";
// File responsibility: Details tab §3 — Documents (structure §7.3 + revision
// contract): the ten LOCKED document titles (estate-page-constants), first 5
// shown with "Show all (N)" for the rest, each row rendered as PENDING — no
// real PDF exists yet, so no download action is offered (never a fake
// download). "[Villa Name]" placeholders resolve to the canonical villa name.
// The legacy API document list stays untouched on disk; it is simply no
// longer mounted on this tab per the locked structure.
import { FileText } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  ESTATE_DOCUMENT_TITLES,
  ESTATE_DOCUMENTS_AVAILABLE,
} from "@/lib/economics/estates/estate-page-constants";
import { Block } from "@/components/common/Block";

const VISIBLE_COUNT = 5;

export function EstateDocumentsPendingSection({ villaName }: { villaName: string | null }) {
  const t = useTranslations("property");
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? ESTATE_DOCUMENT_TITLES : ESTATE_DOCUMENT_TITLES.slice(0, VISIBLE_COUNT);
  return (
    <section className="space-y-2" data-testid="details-documents">
      <h2 className="px-0.5 text-[0.9375rem] font-normal text-foreground">{t("documents")}</h2>
      <Block className="overflow-hidden shadow-sm ring-1 ring-border/50" data-testid="details-documents-card">
        <div className="divide-y divide-border/50">
          {visible.map((doc) => (
            <div
              key={doc.id}
              className="flex min-w-0 items-center gap-3 px-4 py-3 transition-colors duration-150 ease-out hover:bg-surface-2/50"
              data-testid="details-documents-row"
            >
              <FileText
                size={16}
                strokeWidth={1.75}
                aria-hidden
                className="shrink-0 text-muted-foreground"
              />
              <p className="min-w-0 flex-1 text-sm leading-snug text-foreground">
                {doc.title.replace("[Villa Name]", villaName ?? "")}
              </p>
              {!ESTATE_DOCUMENTS_AVAILABLE ? (
                <span className="shrink-0 rounded-full bg-warning/12 px-2 py-0.5 text-[0.6875rem] font-semibold leading-tight text-warning">
                  {t("documentsPendingRow")}
                </span>
              ) : null}
            </div>
          ))}
        </div>
        <div className="border-t border-border/50 px-4 pb-4 pt-1">
          {ESTATE_DOCUMENT_TITLES.length > VISIBLE_COUNT ? (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="inline-flex min-h-[44px] items-center text-sm font-medium text-primary transition-all duration-150 ease-out hover:text-primary/80 active:scale-[0.98]"
              data-testid="details-documents-toggle"
            >
              {showAll
                ? t("documentsShowLess")
                : t("documentsShowAll", { count: ESTATE_DOCUMENT_TITLES.length })}
            </button>
          ) : null}
          {!ESTATE_DOCUMENTS_AVAILABLE ? (
            <p
              className="pt-1 text-xs leading-relaxed text-muted-foreground"
              data-testid="details-documents-pending"
            >
              {t("documentsPendingNote")}
            </p>
          ) : null}
        </div>
      </Block>
    </section>
  );
}
