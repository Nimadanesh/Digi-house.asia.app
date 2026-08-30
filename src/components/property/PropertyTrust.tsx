// File responsibility: trust signal strip — tenant/lease/payment-history/share-demand
// checks derived from existing listing data (REDESIGN-SPEC Phase 5).
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import type { Listing } from "@/types/property";
import { Block } from "@/components/common/Block";

export function PropertyTrust({ listing }: { listing: Listing }) {
  const t = useTranslations("property");
  const { meta } = listing;
  const leaseYear = meta.leaseUntil ? new Date(meta.leaseUntil).getUTCFullYear() : null;
  const paymentsOnTime = listing.rentalHistory.length;

  const items: { ok: boolean; label: string }[] = [
    {
      ok: meta.activeTenant,
      label: meta.activeTenant ? "Active tenant" : "No active tenant",
    },
    {
      ok: Boolean(leaseYear),
      label: leaseYear ? `Lease until ${leaseYear}` : "Lease not set",
    },
    ...(paymentsOnTime > 0
      ? [{ ok: true, label: `${paymentsOnTime} on-time ${paymentsOnTime === 1 ? "payment" : "payments"}` }]
      : []),
    { ok: true, label: `${listing.sharesSold.toLocaleString()} shares sold` },
    { ok: true, label: "Tokenization docs available" },
  ];

  return (
    <Block className="space-y-3 p-4" data-testid="property-trust">
      <h2 className="text-[0.9375rem] font-semibold text-foreground">{t("trustTitle")}</h2>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item.label}
            className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-xs text-foreground"
          >
            {item.ok ? (
              <Check size={14} strokeWidth={2} className="shrink-0 text-success" aria-hidden />
            ) : null}
            {item.label}
          </span>
        ))}
      </div>
      {paymentsOnTime > 0 ? (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t("trustSimulatedNote")}
        </p>
      ) : null}
    </Block>
  );
}
