"use client";
// File responsibility: one collapsed explainer on Income — where operating income
// comes from (rental revenue → costs → net → owner share → your income), with a
// pointer to each estate's Estate tab for the full Slice E economics. Static
// copy only: no numbers, no second calculator, no new engine.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Disclosure } from "@/components/common/Disclosure";

const STEPS = [
  "originStep1",
  "originStep2",
  "originStep3",
  "originStep4",
  "originStep5",
] as const;

export function OperatingIncomeExplainer() {
  const t = useTranslations("earnings");
  const [open, setOpen] = useState(false);
  return (
    <section className="space-y-2" data-testid="income-origin">
      <Disclosure
        title={
          <span className="text-sm font-medium text-foreground">{t("originTitle")}</span>
        }
        open={open}
        onOpenChange={setOpen}
        toggleTestId="income-origin-toggle"
        contentTestId="income-origin-content"
      >
        <ol className="relative space-y-3 border-s border-border ps-5">
          {STEPS.map((key, i) => (
            <li key={key} className="relative flex items-center gap-2.5">
              <span
                aria-hidden
                className="absolute start-[-30px] top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full bg-primary/12 text-[0.6875rem] font-semibold tnum text-primary"
              >
                {i + 1}
              </span>
              <span className="text-sm text-foreground">{t(key)}</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-[0.6875rem] leading-relaxed text-muted-foreground">
          {t("originPointer")}
        </p>
      </Disclosure>
    </section>
  );
}
