"use client";
import { useEffect, useState } from "react";
import { use } from "react";
import { useProperty } from "@/hooks/useProperty";
import { useOrderBook } from "@/hooks/useOrderBook";
import { useTelegram } from "@/hooks/useTelegram";
import { useBuyShares, type BuyInput } from "@/hooks/useBuyShares";
import { PropertyDetail } from "@/components/property/PropertyDetail";
import { Toast } from "@/components/common/Toast";
import { Block } from "@/components/common/Block";
import { Skeleton } from "@/components/common/Skeleton";
import { Button } from "@/components/ui/button";

interface ToastState {
  tone: "success" | "error";
  title: string;
  sub?: string;
}

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const property = useProperty(id);
  const orderBook = useOrderBook(id);
  const tg = useTelegram();
  const buy = useBuyShares();
  const [qty, setQty] = useState<number>(1);
  const [toast, setToast] = useState<ToastState | null>(null);

  // Toast auto-dismiss after 3s (DESIGN_SYSTEM §"Toast / Snackbar").
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // BackButton lifecycle — show on detail, hide on unmount (USER_FLOW §"Route ↔ screen").
  useEffect(() => {
    tg.backButton.show();
    return () => tg.backButton.hide();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // MainButton wiring (USER_FLOW §"MainButton lifecycle"):
  // shown only on Property detail when there is a single primary action (Buy confirm)
  // AND sharesRemaining > 0. Hidden on root tabs and on fully-funded/resale detail.
  useEffect(() => {
    const listing = property.data;
    if (!listing) {
      tg.mainButton.hide();
      return;
    }
    const remaining = listing.sharesRemaining;
    if (remaining <= 0) {
      tg.mainButton.hide();
      return;
    }
    const valid = qty >= 1 && qty <= remaining;
    const totalUsd = qty * listing.sharePriceUsd;
    tg.mainButton.setParams({
      text: `Buy ${qty} — $${(totalUsd / 100).toFixed(2)}`,
      isEnabled: valid,
    });
    const off = tg.mainButton.onClick(async () => {
      if (!valid || !listing) return;
      tg.haptics.impact("medium");
      const input: BuyInput = {
        propertyId: listing.id,
        quantity: qty,
        priceUsdPerShare: listing.sharePriceUsd,
        toFriendlyAddress: listing.ownerWalletAddress,
      };
      try {
        const res = await buy.mutateAsync(input);
        if (res.ok) {
          // MVP honesty contract (PLAN §"MVP payout honesty"): exact toast text, synthetic txHash sub.
          setToast({ tone: "success", title: "Buy confirmed (simulated)", sub: `tx: ${res.txHash}` });
          tg.haptics.notification("success");
        } else {
          setToast({ tone: "error", title: "Buy failed", sub: res.error });
          tg.haptics.notification("error");
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : "transaction rejected";
        setToast({ tone: "error", title: "Buy failed", sub: message });
        tg.haptics.notification("error");
      }
    });
    return () => {
      off();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [property.data, qty]);

  // Hide MainButton when leaving the route (root tabs own the bottom bar elsewhere).
  useEffect(() => {
    return () => tg.mainButton.hide();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (property.isLoading) {
    return (
      <div className="space-y-3 mt-3">
        <Skeleton className="h-48 w-full rounded-[12px]" />
        <Block className="p-4 space-y-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-full" />
        </Block>
        <Block className="p-4 space-y-2">
          <Skeleton className="h-10 w-full" />
        </Block>
      </div>
    );
  }
  if (property.isError || !property.data) {
    return (
      <Block className="mt-3 p-4 text-center">
        <p className="text-sm text-muted-foreground mb-3">Couldn&apos;t load this property.</p>
        <Button onClick={() => property.refetch()}>Retry</Button>
      </Block>
    );
  }

  return (
    <>
      {toast ? <Toast tone={toast.tone} title={toast.title} sub={toast.sub} /> : null}
      <PropertyDetail
        listing={property.data}
        orderBook={orderBook.data}
        onConfirm={(q: number) => setQty(q)}
      />
    </>
  );
}