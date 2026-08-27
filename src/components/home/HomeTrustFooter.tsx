"use client";
// File responsibility: Home quiet trust/footer element (redesign). A single muted line reassuring
// the investor about the locked income model + MVP honesty — no badges, no emphasis.
import { useTranslations } from "next-intl";

export function HomeTrustFooter() {
  const t = useTranslations("home");
  return (
    <footer className="mt-1 px-4 pb-1 text-center" data-testid="home-trust-footer">
      <p className="text-[0.6875rem] leading-relaxed text-muted-foreground">{t("trustFooter")}</p>
    </footer>
  );
}