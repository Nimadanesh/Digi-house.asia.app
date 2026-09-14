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
      <Block className="p-4">
        <div className="space-y-2.5">
          {v1.excludedCharges.map((charge) => (
            <div
              key={charge.name}
              className="flex min-w-0 items-start gap-2"
              data-testid="income-excluded-row"
            >
              <Check
                size={16}
                strokeWidth={2.25}
                aria-hidden
                className="mt-0.5 shrink-0 text-success"
              />
              <div className="min-w-0">
                <p className="text-sm leading-snug text-foreground">{charge.name}</p>
                <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {charge.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
        <p className="pt-3 text-xs leading-relaxed text-muted-foreground/80">
          {t("incomeNotDeductedNote")}
        </p>
      </Block>
    </section>
  );
}
