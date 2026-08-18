"use client";
// File responsibility: Property detail route — data load, Telegram chrome (Back/Main), Buy sheet flow.
// UI sections stay in components/property; wizard step + qty state live here.
import { useCallback, useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useProperty } from "@/hooks/useProperty";
import { useOrderBook } from "@/hooks/useOrderBook";
import { useTelegram } from "@/hooks/useTelegram";
import { useTonConnect } from "@/hooks/useTonConnect";
import { useBuyShares, type BuyInput, UsdtUnavailableError } from "@/hooks/useBuyShares";
import { usePropertyDocuments } from "@/hooks/usePropertyDocuments";
import { useUiStore } from "@/stores/ui.store";
import { haptics } from "@/lib/telegram/haptics";
import { usd } from "@/lib/format";
import type { BuyCurrency } from "@/types/buy";
import { PropertyDetail } from "@/components/property/PropertyDetail";
import { PropertyDetailSkeleton } from "@/components/property/PropertyDetailSkeleton";
import { BuySheet, type BuySheetStep } from "@/components/property/buy/BuySheet";
import { Toast } from "@/components/common/Toast";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { BrowseMarketplaceCta } from "@/components/common/BrowseMarketplaceCta";
import { StickyBuyBar } from "@/components/property/StickyBuyBar";

interface ToastState {
  tone: "success" | "error";
  title: string;
  sub?: string;
  leaving: boolean;
}

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const tCommon = useTranslations("common");
  const tOnboarding = useTranslations("onboarding");
  const property = useProperty(id);
  const orderBook = useOrderBook(id, { live: true });
  const { documents, download: docDownload } = usePropertyDocuments(id);
  const { backButton, mainButton } = useTelegram();
  const ton = useTonConnect();
  const buy = useBuyShares();
  const router = useRouter();
  const setMainButtonActive = useUiStore((s) => s.setMainButtonActive);
  const settingsOpen = useUiStore((s) => s.settingsOpen);

  const [previewShares, setPreviewShares] = useState(10);
  const [qty, setQty] = useState(10);
  const [currency, setCurrency] = useState<BuyCurrency>("TON");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [step, setStep] = useState<BuySheetStep>("qty");
  const [toast, setToast] = useState<ToastState | null>(null);
  const [buyError, setBuyError] = useState<string | null>(null);
  /** False once the server reports USDT as not configured (409 payment_method_unavailable). */
  const [usdtAvailable, setUsdtAvailable] = useState(true);

  const listing = property.data;
  const remaining = listing?.sharesRemaining ?? 0;
  const canBuy = Boolean(listing && remaining > 0);

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    setStep("qty");
    setBuyError(null);
  }, []);

  // Toast lifecycle — DESIGN_SYSTEM §Toast.
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

  // BackButton — safe chrome never throws (even if TG unavailable).
  useEffect(() => {
    if (settingsOpen) return;
    try {
      backButton.show();
    } catch {
      /* ignore */
    }
    let off: () => void = () => {};
    try {
      off = backButton.onClick(() => {
        haptics.selection();
        if (sheetOpen) {
          if (step === "summary") {
            setStep("qty");
            return;
          }
          closeSheet();
          return;
        }
        router.back();
      });
    } catch {
      /* ignore */
    }
    return () => {
      try {
        off();
      } catch {
        /* ignore */
      }
    };
  }, [sheetOpen, step, closeSheet, router, backButton, settingsOpen]);

  useEffect(() => {
    return () => {
      try {
        backButton.hide();
      } catch {
        /* ignore */
      }
    };
  }, [backButton]);

  const confirmBuy = useCallback(async () => {
    if (!listing) return;
    setBuyError(null);
    haptics.impact("medium");
    const input: BuyInput = {
      propertyId: listing.id,
      quantity: qty,
      priceUsdPerShare: listing.sharePriceUsd,
      currency,
    };
    try {
      const res = await buy.mutateAsync(input);
      if (res.ok) {
        setStep("success");
        haptics.notification("success");
      } else {
        setBuyError(res.error || "Buy failed");
        setToast({ tone: "error", title: "Buy failed", sub: res.error, leaving: false });
        haptics.notification("error");
      }
    } catch (e) {
      // USDT not configured on the server → fall back to TON and tell the user.
      if (e instanceof UsdtUnavailableError) {
        setCurrency("TON");
        setUsdtAvailable(false);
        setBuyError(e.message);
        setToast({
          tone: "error",
          title: "USDT unavailable",
          sub: "Switching you to TON for this purchase.",
          leaving: false,
        });
        haptics.notification("error");
        return;
      }
      const message = e instanceof Error ? e.message : "transaction rejected";
      setBuyError(message);
      setToast({ tone: "error", title: "Buy failed", sub: message, leaving: false });
      haptics.notification("error");
    }
  }, [listing, qty, currency, buy]);

  // MainButton — Fable: closed → "Buy Share"; sheet qty → Continue; summary → Confirm & Pay; success → hidden.
  useEffect(() => {
    if (!listing) {
      mainButton.hide();
      setMainButtonActive(false);
      return;
    }

    if (sheetOpen && step === "success") {
      mainButton.hide();
      // Keep tab bar suppressed while success sheet is open (match sheet chrome).
      setMainButtonActive(true);
      return;
    }

    if (!sheetOpen) {
      if (!canBuy) {
        mainButton.hide();
        setMainButtonActive(false);
        return;
      }
      setMainButtonActive(true);
      mainButton.setParams({
        text: tCommon("buyShare"),
        isEnabled: true,
        color: "#3390ec",
        textColor: "#ffffff",
      });
      const off = mainButton.onClick(() => {
        haptics.impact("light");
        setQty(Math.min(remaining, Math.max(1, previewShares)));
        setCurrency("TON");
        setStep("qty");
        setSheetOpen(true);
      });
      return () => {
        off();
      };
    }

    // Sheet open — qty / summary
    setMainButtonActive(true);

    if (!ton.connected) {
      mainButton.setParams({
        text: tCommon("connectWallet"),
        isEnabled: true,
        color: "#3390ec",
        textColor: "#ffffff",
      });
      const off = mainButton.onClick(() => {
        haptics.impact("light");
        ton.openModal();
      });
      return () => {
        off();
      };
    }

    if (step === "qty") {
      const valid = qty >= 1 && qty <= remaining;
      mainButton.setParams({
        text: tOnboarding("continue"),
        isEnabled: valid && remaining > 0,
        color: "#3390ec",
        textColor: "#ffffff",
      });
      const off = mainButton.onClick(() => {
        if (!valid) return;
        haptics.selection();
        setStep("summary");
      });
      return () => {
        off();
      };
    }

    if (step === "summary") {
      const valid = qty >= 1 && qty <= remaining;
      const totalUsd = qty * listing.sharePriceUsd;
      const pending = buy.isPending;
      mainButton.setParams({
        text: pending ? "Confirming…" : `Confirm & Pay — ${usd(totalUsd)}`,
        isEnabled: valid && !pending,
        color: "#3390ec",
        textColor: "#ffffff",
        isLoaderVisible: pending,
      });
      const off = mainButton.onClick(() => {
        if (!valid || buy.isPending) return;
        void confirmBuy();
      });
      return () => {
        off();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    listing,
    canBuy,
    sheetOpen,
    step,
    qty,
    remaining,
    ton.connected,
    previewShares,
    buy.isPending,
    confirmBuy,
    tCommon,
    tOnboarding,
    mainButton,
  ]);

  useEffect(() => {
    return () => {
      setMainButtonActive(false);
      mainButton.hide();
    };
  }, [mainButton, setMainButtonActive]);

  if (property.isLoading && !property.data) {
    return <PropertyDetailSkeleton />;
  }

  if (property.isError && !property.data) {
    return (
      <ErrorState
        className="mt-4"
        message="Couldn't load this property."
        onRetry={() => {
          haptics.impact("light");
          void property.refetch();
        }}
        data-testid="property-error"
      />
    );
  }

  if (!listing) {
    return (
      <EmptyState
        title="Property not found"
        message="This listing may have been removed or the link is wrong."
        action={<BrowseMarketplaceCta />}
      />
    );
  }

  return (
    <>
      {toast ? <Toast tone={toast.tone} title={toast.title} sub={toast.sub} leaving={toast.leaving} /> : null}
      <div className={canBuy && !sheetOpen ? "pb-20" : undefined}>
        <PropertyDetail
          listing={listing}
          orderBook={orderBook.data}
          previewShares={previewShares}
          onPreviewSharesChange={setPreviewShares}
          documents={documents}
          onDownloadDoc={(docId) => docDownload.mutate(docId)}
          downloadingDocId={docDownload.isPending ? String(docDownload.variables) : null}
        />
      </div>
      {canBuy && !sheetOpen ? (
        <StickyBuyBar
          onClick={() => {
            haptics.impact("light");
            setQty(Math.min(remaining, Math.max(10, previewShares)));
            setCurrency("TON");
            setStep("qty");
            setSheetOpen(true);
          }}
        />
      ) : null}
      <BuySheet
        open={sheetOpen}
        onClose={closeSheet}
        listing={listing}
        step={step}
        qty={qty}
        onQtyChange={(q) => {
          setBuyError(null);
          setQty(q);
        }}
        walletConnected={ton.connected}
        currency={currency}
        onCurrencyChange={(c) => {
          setBuyError(null);
          setCurrency(c);
        }}
        usdtAvailable={usdtAvailable}
        buyError={buyError}
        buyPending={buy.isPending}
        buyVerifying={buy.phase === "verifying"}
      />
    </>
  );
}
