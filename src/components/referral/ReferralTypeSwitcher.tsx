"use client";
// File responsibility: Referral Hub type switcher — Standard/Club segmented
// control. Pure discovery switch (not navigation); controlled by the page.
import { useTranslations } from "next-intl";
import { haptics } from "@/lib/telegram/haptics";
import { cn } from "@/lib/utils";
import styles from "./referral-glass.module.css";
import type { ReferralTab } from "./referral-tab";

export function ReferralTypeSwitcher({
  value,
  onChange,
}: {
  value: ReferralTab;
  onChange: (tab: ReferralTab) => void;
}) {
  const t = useTranslations("referral");

  const options: Array<{ id: ReferralTab; testid: string; label: string }> = [
    { id: "standard", testid: "referral-tab-standard", label: t("tabStandard") },
    { id: "club", testid: "referral-tab-club", label: t("tabClub") },
  ];

  return (
    <div
      role="tablist"
      aria-label={t("eyebrow")}
      data-testid="referral-switcher"
      className={`${styles.glass} flex gap-1 rounded-[18px] p-1`}
    >
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            data-testid={opt.testid}
            onClick={() => {
              haptics.selection();
              onChange(opt.id);
            }}
            className={cn(
              "flex min-h-[44px] flex-1 items-center justify-center rounded-[14px] px-4 text-[15px] font-semibold transition-all duration-150 ease-out active:scale-[0.98]",
              active ? "bg-[#4B8BFF] text-white" : "text-muted-foreground",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
