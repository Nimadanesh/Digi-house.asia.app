"use client";
// File responsibility: self-contained commission trigger — icon-only (cards) or labeled pill
// (detail pages). Owns the sheet state so server components can embed it directly.
import { useState } from "react";
import { Percent } from "lucide-react";
import { useTranslations } from "next-intl";
import { haptics } from "@/lib/telegram/haptics";
import { cn } from "@/lib/utils";
import { FeeScheduleSheet } from "./FeeScheduleSheet";

export function FeeInfoButton({
  variant = "pill",
  className,
}: {
  variant?: "pill" | "icon";
  className?: string;
}) {
  const t = useTranslations("marketplace");
  const [open, setOpen] = useState(false);

  return (
    <>
      <span
        role="button"
        tabIndex={0}
        aria-label={t("feesTitle")}
        data-testid="fee-info-button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          haptics.impact("light");
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={cn(
          "inline-flex cursor-pointer select-none items-center justify-center active:scale-[0.97] transition-transform duration-[120ms] ease-out",
          variant === "icon"
            ? "size-8 rounded-full bg-black/55 text-white"
            : "min-h-[32px] gap-1.5 rounded-full bg-surface-2 px-3 text-xs font-medium text-foreground",
          className,
        )}
      >
        <Percent size={variant === "icon" ? 16 : 14} strokeWidth={1.75} aria-hidden />
        {variant === "pill" ? t("feesTitle") : null}
      </span>
      <FeeScheduleSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
