"use client";
// File responsibility: Private Escape section + gift sheet — premium gifting
// concept (occasion → destination → digital invitation). Storytelling and
// product preview only: no dates, availability, booking, or payments.
import { useState } from "react";
import { Gift, MoonStar } from "lucide-react";
import { useTranslations } from "next-intl";
import { haptics } from "@/lib/telegram/haptics";
import { Sheet } from "@/components/common/Sheet";
import { cn } from "@/lib/utils";
import styles from "./club-glass.module.css";

const OCCASIONS = ["valentine", "anniversary", "birthday", "honeymoon", "special"] as const;

export function ClubEscapeSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("club");
  const [occasion, setOccasion] = useState<(typeof OCCASIONS)[number]>("valentine");

  return (
    <Sheet open={open} onClose={onClose} labelledBy="club-escape-sheet-title" className={`bg-transparent ${styles.sheetPanel}`}>
      <div className="space-y-4 pb-2">
        <h2 id="club-escape-sheet-title" className="text-[1.0625rem] font-semibold tracking-tight text-foreground">
          {t("escapeTitle")}
        </h2>
        <div>
          <h3 className="text-[0.8125rem] font-semibold text-foreground">{t("escapeOccasionsTitle")}</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {OCCASIONS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  haptics.selection();
                  setOccasion(key);
                }}
                aria-pressed={occasion === key}
                data-testid="escape-occasion"
                data-occasion={key}
                className={cn(
                  "flex min-h-[44px] items-center rounded-full border px-4 text-sm font-medium active:opacity-80",
                  occasion === key
                    ? "border-primary/60 bg-primary/15 text-primary"
                    : "border-border bg-surface-2 text-muted-foreground",
                )}
              >
                {t(`occasion.${key}`)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-[0.8125rem] font-semibold text-foreground">{t("escapeDestinationTitle")}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t("escapeDestinationBody")}</p>
        </div>
        <div>
          <h3 className="text-[0.8125rem] font-semibold text-foreground">{t("escapeInvitationTitle")}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground tnum">
            {t("escapeInvitationFor", { occasion: t(`occasion.${occasion}`) })}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t("escapeInvitationBody")}</p>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">{t("escapeNote")}</p>
      </div>
    </Sheet>
  );
}

export function ClubEscapeSection() {
  const t = useTranslations("club");
  const [open, setOpen] = useState(false);

  return (
    <section aria-label={t("escapeTitle")} data-testid="club-escape">
      <div className={`${styles.glass3} relative overflow-hidden rounded-[22px]`}>
        <div className="relative p-5">
          <div className="flex items-center gap-3">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#4B8BFF]/15 text-[#4B8BFF]"
              aria-hidden
            >
              <MoonStar size={20} strokeWidth={1.75} />
            </span>
            <h2 className="text-[0.9375rem] font-semibold text-foreground">{t("escapeTitle")}</h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("escapeSub")}</p>
          <button
            type="button"
            data-testid="club-escape-cta"
            onClick={() => {
              haptics.selection();
              setOpen(true);
            }}
            className={`${styles.btnPrimary} mt-3 flex min-h-[48px] w-full items-center justify-center gap-2 text-[15px] font-semibold transition-transform duration-150 ease-out active:scale-[0.98]`}
          >
            <Gift size={17} strokeWidth={2} aria-hidden />
            {t("escapeCta")}
          </button>
        </div>
      </div>
      <ClubEscapeSheet open={open} onClose={() => setOpen(false)} />
    </section>
  );
}
