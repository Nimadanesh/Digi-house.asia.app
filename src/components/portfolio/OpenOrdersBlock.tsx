"use client";
// File responsibility: open secondary-market orders section on Portfolio (seed demo readiness).
// PD-08: open/queued orders can be cancelled — buy escrow is refunded atomically on the API.
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";
import { StatusPill } from "@/components/common/StatusPill";
import { usd } from "@/lib/format";
import { haptics } from "@/lib/telegram/haptics";
import type { Order } from "@/types/order";

export function OpenOrdersBlock({
  orders,
  nameById,
  onCancel,
  cancellingId = null,
}: {
  orders: Order[];
  nameById: Record<string, string>;
  onCancel?: (orderId: string) => void;
  /** Order id currently being cancelled (drives the per-row pending state). */
  cancellingId?: string | null;
}) {
  const t = useTranslations("portfolio");
  const tCommon = useTranslations("common");

  if (orders.length === 0) return null;
  return (
    <section className="space-y-2" data-testid="open-orders">
      <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">{t("openOrders")}</h2>
      <Block>
        {orders.map((o) => {
          const cancellable = onCancel && (o.status === "open" || o.status === "queued");
          const cancelling = cancellingId === o.id;
          return (
            <Row key={o.id} className="!min-h-[56px]">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-foreground">
                  {nameById[o.propertyId] ?? o.propertyId}
                </div>
                <div className="mt-1 text-xs leading-relaxed text-muted-foreground capitalize">
                  {o.side} · {o.quantity} {tCommon("shares")}
                </div>
              </div>
              <div className="shrink-0 text-end space-y-1">
                <div className="text-sm font-semibold tnum text-foreground">{usd(o.priceUsd)}</div>
                {o.status === "queued" ? (
                  <div className="flex justify-end">
                    <StatusPill label={t("orderQueued")} variant="warning" />
                  </div>
                ) : (
                  <div className="text-[0.6875rem] uppercase tracking-wide text-warning">{t("orderOpen")}</div>
                )}
              </div>
              {cancellable ? (
                <button
                  type="button"
                  aria-label={`Cancel order ${o.side} ${o.quantity} shares`}
                  disabled={cancelling}
                  onClick={() => {
                    haptics.impact("light");
                    onCancel(o.id);
                  }}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted-foreground active:scale-[0.95] transition-transform duration-[120ms] ease-out disabled:opacity-40"
                  data-testid={`cancel-order-${o.id}`}
                >
                  <X size={16} strokeWidth={2} aria-hidden />
                </button>
              ) : null}
            </Row>
          );
        })}
      </Block>
    </section>
  );
}
