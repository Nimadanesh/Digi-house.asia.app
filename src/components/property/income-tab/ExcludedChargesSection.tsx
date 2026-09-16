"use client";
// File responsibility: Income tab §4 — Not deducted from your income
// (structure §5.4 + revision contract): guest-paid charges (green tax, damage
// waiver, …) as a simple green-check list — no expansion needed — with the
// locked transparency footer. Names/details preserved verbatim from the V1
// excluded-charge records (classification A_GUEST_PAID, deducted:false by
// type contract). Renders nothing when the villa lists none.
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FinancialModelV1PropertyModel } from "@/types/financial-model-v1";
import { Block } from "@/components/common/Block";

export function ExcludedChargesSection({
  v1,
}: {
  v1: FinancialModelV1PropertyModel;
}) {
  const t = useTranslations("property");
  if (v1.excludedCharges.length === 0) return null;
  return (
    <section className="space-y-2" data-testid="income-excluded">
      <h2 className="px-0.5 text-[0.9375rem] font-normal text-foreground">
        {t("incomeNotDeductedTitle")}
      </h2>
      <Block className="p-4 shadow-sm ring-1 ring-border/50 sm:p-5">
        <div className="space-y-3">
          {v1.excludedCharges.map((charge) => (
            <div
              key={charge.name}
              className="flex min-w-0 items-center gap-2.5"
              data-testid="income-excluded-row"
            >
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success/12 [&>svg]:block"
                aria-hidden
              >
                <Check size={15} strokeWidth={2.25} className="text-success" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium leading-snug tracking-[-0.01em] text-foreground">{charge.name}</p>
                <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {charge.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 border-t border-border/50 pt-3 text-xs leading-relaxed text-muted-foreground/80">
          {t("incomeNotDeductedNote")}
        </p>
      </Block>
    </section>
  );
}
