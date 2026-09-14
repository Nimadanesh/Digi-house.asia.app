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
      <Block className="overflow-hidden p-4" data-testid="details-documents-card">
        <div className="space-y-2.5">
          {visible.map((doc) => (
            <div
              key={doc.id}
              className="flex min-w-0 items-start gap-2"
              data-testid="details-documents-row"
            >
              <FileText
                size={16}
                strokeWidth={1.75}
                aria-hidden
                className="mt-0.5 shrink-0 text-muted-foreground"
              />
              <div className="min-w-0">
                <p className="text-sm leading-snug text-foreground">
                  {doc.title.replace("[Villa Name]", villaName ?? "")}
                </p>
                {!ESTATE_DOCUMENTS_AVAILABLE ? (
                  <p className="text-xs text-muted-foreground">{t("documentsPendingRow")}</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
        {ESTATE_DOCUMENT_TITLES.length > VISIBLE_COUNT ? (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="mt-3 inline-flex min-h-[44px] items-center text-sm font-medium text-primary"
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
      </Block>
    </section>
  );
}
