"use client";
import { useEffect, useState } from "react";
import { use } from "react";
import { useProperty } from "@/hooks/useProperty";
import { useOrderBook } from "@/hooks/useOrderBook";
import { useTelegram } from "@/hooks/useTelegram";
import { useTonConnect } from "@/hooks/useTonConnect";
import { useBuyShares, type BuyInput } from "@/hooks/useBuyShares";
import { useRouter } from "next/navigation";
import { useUiStore } from "@/stores/ui.store";
import { PropertyDetail } from "@/components/property/PropertyDetail";
import { Toast } from "@/components/common/Toast";
import { Block } from "@/components/common/Block";
import { Skeleton } from "@/components/common/Skeleton";
import { Button } from "@/components/ui/button";

interface ToastState {
  tone: "success" | "error";
  title: string;
  sub?: string;
  leaving: boolean;
}

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const property = useProperty(id);
  const orderBook = useOrderBook(id);
  const tg = useTelegram();
  const ton = useTonConnect();
  const buy = useBuyShares();
  const router = useRouter();
  const setMainButtonActive = useUiStore((s) => s.setMainButtonActive);
  const [qty, setQty] = useState<number>(1);
  const [toast, setToast] = useState<ToastState | null>(null);

  // Toast lifecycle (DESIGN_SYSTEM §"Toast / Snackbar"): show 3s, then enter the 160ms leaving
  // state, then unmount. Two-stage timer so the CSS exit transition actually runs before unmount.
  // Deps keyed on toast identity (tone/title/sub) so the timers don't reset when `leaving` flips.
  useEffect(() => {
    if (!toast) return;
    const leaveTimer = setTimeout(() => setToast((t) => (t ? { ...t, leaving: true } : null)), 3000);
    const unmountTimer = setTimeout(() => setToast(null), 3160);
    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(unmountTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast?.tone, toast?.title, toast?.sub]);

  // BackButton lifecycle (USER_FLOW §"Route ↔ screen"): show + wire to router.back() so the TG
  // on-screen back chevron actually navigates. Outside Telegram the Header's in-app chevron handles it.
  useEffect(() => {
    tg.backButton.show();
    const off = tg.backButton.onClick(() => router.back());
    return () => {
      off();
      tg.backButton.hide();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // MainButton wiring (USER_FLOW §"MainButton lifecycle"):
  // shown only on Property detail when there is a single primary action (Buy confirm)
  // AND sharesRemaining > 0. Hidden on root tabs and on fully-funded/resale detail.
  useEffect(() => {
    const listing = property.data;
    if (!listing) {
      tg.mainButton.hide();
      setMainButtonActive(false);
      return;
    }
    const remaining = listing.sharesRemaining;
    // Hide MainButton when wallet disconnected (so BuyControl's Connect-Wallet CTA is the sole
    // primary action) or when no primary shares remain (Fully-funded/resale state).
    if (!ton.connected || remaining <= 0) {
      tg.mainButton.hide();
      setMainButtonActive(false);
      return;
    }
    setMainButtonActive(true);
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
          setToast({ tone: "success", title: "Buy confirmed (simulated)", sub: `tx: ${res.txHash}`, leaving: false });
          tg.haptics.notification("success");
        } else {
          setToast({ tone: "error", title: "Buy failed", sub: res.error, leaving: false });
          tg.haptics.notification("error");
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : "transaction rejected";
        setToast({ tone: "error", title: "Buy failed", sub: message, leaving: false });
        tg.haptics.notification("error");
      }
    });
    return () => {
      off();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [property.data, qty, ton.connected]);

  // Hide MainButton + release the shell's mainButtonActive flag when leaving the route
  // (root tabs own the bottom bar elsewhere). Order: clear the flag first so AppShell restores
  // the tab bar before the native MainButton finishes hiding — avoids a flash of empty bottom padding.
  useEffect(() => {
    return () => {
      setMainButtonActive(false);
      tg.mainButton.hide();
    };
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
      {toast ? <Toast tone={toast.tone} title={toast.title} sub={toast.sub} leaving={toast.leaving} /> : null}
      <PropertyDetail
        listing={property.data}
        orderBook={orderBook.data}
        qty={qty}
        onQtyChange={setQty}
      />
    </>
  );
}