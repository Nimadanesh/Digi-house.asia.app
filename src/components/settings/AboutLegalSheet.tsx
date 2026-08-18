"use client";
// File responsibility: nested About / Legal sheet — disclaimers once (MVP honesty).
import { useTranslations } from "next-intl";
import { Sheet } from "@/components/common/Sheet";

export function AboutLegalSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("settings");

  return (
    <Sheet open={open} onClose={onClose} labelledBy="about-legal-title" className="max-h-[85svh]">
      <div className="space-y-4 pb-4" data-testid="about-legal-sheet">
        <h2 id="about-legal-title" className="text-[1.0625rem] font-semibold leading-snug text-foreground">
          {t("aboutLegal")}
        </h2>
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>{t("aboutBody")}</p>
          <p className="text-[0.6875rem] leading-relaxed text-muted-foreground">{t("demoTxDisclaimer")}</p>
          <p className="text-[0.6875rem] leading-relaxed text-muted-foreground">{t("payoutDisclaimer")}</p>
          <p>{t("aboutAdvice")}</p>
          <p className="pt-0.5 text-xs leading-relaxed text-muted-foreground">{t("aboutCopyright")}</p>
        </div>
      </div>
    </Sheet>
  );
}
