"use client";
// File responsibility: ONE book address row — address + network/verified pills,
// promote-to-primary and delete actions. Presentational.
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { Row } from "@/components/common/Row";
import { StatusPill } from "@/components/common/StatusPill";
import type { BookAddress } from "@/stores/settings.store";
import type { PayoutNetwork } from "@/lib/addresses";
import { shortAddr } from "@/lib/format";

export function NetworkPill({ network }: { network: PayoutNetwork }) {
  const t = useTranslations("settings");
  const label: Record<PayoutNetwork, string> = {
    ton: t("netTon"),
    ethereum: t("netEthereum"),
    tron: t("netTron"),
    bnb: t("netBnb"),
    polygon: t("netPolygon"),
    arbitrum: t("netArbitrum"),
  };
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-primary/12 px-2 py-0.5 text-[0.6875rem] font-semibold text-primary">
      {label[network]}
    </span>
  );
}

export function AddressRow({
  entry,
  onDelete,
  onUse,
  using = false,
}: {
  entry: BookAddress;
  onDelete: () => void;
  onUse: () => void;
  using?: boolean;
}) {
  const t = useTranslations("settings");
  return (
    <Row className="!min-h-[64px] items-center py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-sm tnum text-foreground">
          {shortAddr(entry.address, { prefix: 6, suffix: 6 })}
        </p>
        <p className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <NetworkPill network={entry.network} />
          <StatusPill label={t("withdrawalUnverified")} variant="warning" />
        </p>
      </div>
      <button
        type="button"
        onClick={onUse}
        disabled={using}
        className="shrink-0 rounded-[8px] bg-surface-2 px-3 py-2 text-[0.8125rem] font-semibold text-primary active:scale-[0.97] transition-transform duration-[120ms] ease-out disabled:opacity-40"
        data-testid="settings-address-use"
      >
        {t("addressUse")}
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label={t("addressDelete")}
        className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground active:scale-[0.95] transition-transform duration-[120ms] ease-out"
        data-testid="settings-address-delete"
      >
        <Trash2 size={18} strokeWidth={1.75} aria-hidden />
      </button>
    </Row>
  );
}
