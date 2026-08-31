// File responsibility: trust signal block (REDESIGN-SPEC Phase 5 / Phase 9 UI
// Mapping §10). Verification is modeled as an honest state via the Slice 1 guard:
// a "Verified · date" chip renders ONLY when a real verification snapshot with a
// date exists; otherwise "Verification pending" — never a fabricated check.
// Management partner is UNAVAILABLE today → "not yet published".
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import type { Listing } from "@/types/property";
import type { EstateVerification } from "@/types/verification";
import { isVerified } from "@/types/verification";
import { Block } from "@/components/common/Block";

export function PropertyTrust({
  listing,
  verification,
}: {
  listing: Listing;
  /** Optional verification snapshot — chip renders only when genuinely verified. */
  verification?: EstateVerification;
}) {
  const t = useTranslations("property");
  const { meta } = listing;
  const leaseYear = meta.leaseUntil ? new Date(meta.leaseUntil).getUTCFullYear() : null;
  const paymentsOnTime = listing.rentalHistory.length;
  const verified = isVerified(verification);

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

      {/* Verification state — honest chip, never fabricated. */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          {verified ? (
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-success/12 px-2.5 py-1 text-xs font-semibold text-success"
              data-testid="trust-verified"
            >
              <Check size={14} strokeWidth={2} className="shrink-0" aria-hidden />
              {t("trustVerifiedAt", { date: verification!.lastVerifiedAt })}
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted-foreground"
              data-testid="trust-verification-pending"
            >
              {t("trustVerificationPending")}
            </span>
          )}
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground" data-testid="trust-management">
          {t("trustManagementPending")}
        </p>
      </div>

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
