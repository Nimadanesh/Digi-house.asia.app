// File responsibility: trust checks + tokenization doc demo link (Fable §Trust).
import { Check } from "lucide-react";
import type { Listing } from "@/types/property";
import { Block } from "@/components/common/Block";

export function PropertyTrust({ listing }: { listing: Listing }) {
  const { meta } = listing;
  const leaseYear = meta.leaseUntil ? new Date(meta.leaseUntil).getUTCFullYear() : null;
  const items: { ok: boolean; label: string }[] = [
    { ok: meta.activeTenant, label: meta.activeTenant ? "Active tenant ✓" : "No active tenant" },
    {
      ok: Boolean(leaseYear),
      label: leaseYear ? `Lease until ${leaseYear} ✓` : "Lease not set",
    },
  ];

  return (
    <Block className="p-4 space-y-3" data-testid="property-trust">
      <h2 className="text-[0.9375rem] font-semibold text-foreground">Trust</h2>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item.label}
            className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-xs text-foreground"
          >
            {item.ok ? <Check size={14} strokeWidth={2} className="text-success" aria-hidden /> : null}
            {item.label}
          </span>
        ))}
      </div>
      <a
        href={meta.tokenizationDocUrl}
        className="inline-flex min-h-[44px] items-center text-sm font-medium text-primary"
        onClick={(e) => {
          if (meta.tokenizationDocUrl.startsWith("#")) e.preventDefault();
        }}
      >
        Tokenization Document
      </a>
    </Block>
  );
}
