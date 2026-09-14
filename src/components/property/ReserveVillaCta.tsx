// File responsibility: Estate tab closing CTA — secondary full-width external
// link to the property's official Rental Escapes listing. The URL arrives via
// props from the view-model (canonical data); this component never constructs,
// guesses, or falls back to a URL — without one it renders nothing.
"use client";
import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { haptics } from "@/lib/telegram/haptics";

export function ReserveVillaCta({ url }: { url: string | null }) {
  const t = useTranslations("property");
  if (url == null) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => haptics.selection()}
      data-testid="reserve-villa-cta"
      className="flex h-[44px] w-full items-center justify-center gap-2 rounded-[10px] border border-border bg-transparent text-sm font-semibold text-foreground active:scale-[0.97] transition-transform duration-[120ms] ease-out"
    >
      {t("reserveVilla")}
      <ExternalLink size={16} strokeWidth={1.75} aria-hidden />
    </a>
  );
}
