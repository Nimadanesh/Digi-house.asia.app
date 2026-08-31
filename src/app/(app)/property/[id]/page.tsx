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
import { usePortfolio } from "@/hooks/usePortfolio";
import { usePropertyDocuments } from "@/hooks/usePropertyDocuments";
import { useStay } from "@/hooks/useStay";
import { useLocks, activeLocksForProperty } from "@/hooks/useLocks";
import { useScrolledPast } from "@/hooks/useScrolledPast";
import { useUiStore } from "@/stores/ui.store";
import { haptics } from "@/lib/telegram/haptics";
import { usd } from "@/lib/format";
import { getCurrentSharePrice } from "@/lib/property-price";
import type { BuyCurrency } from "@/types/buy";
import { PropertyDetail } from "@/components/property/PropertyDetail";
import { PropertyDetailSkeleton } from "@/components/property/PropertyDetailSkeleton";
import { BuySheet, type BuySheetStep } from "@/components/property/buy/BuySheet";
import { closeTopSheet } from "@/components/common/Sheet";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { BrowseMarketplaceCta } from "@/components/common/BrowseMarketplaceCta";
import { PropertyStickyCta } from "@/components/property/PropertyStickyCta";
import { LimitBuySheet } from "@/components/property/LimitBuySheet";
import { SellSheet } from "@/components/property/SellSheet";
import { PropertyCompactTopBar } from "@/components/property/PropertyCompactTopBar";
import { useScrollDirection } from "@/hooks/useScrollDirection";

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const tCommon = useTranslations("common");
  const tOnboarding = useTranslations("onboarding");
  const property = useProperty(id);
  const orderBook = useOrderBook(id, { live: true });
  const stayQuery = useStay(id);
  const portfolio = usePortfolio();
  const { documents, download: docDownload } = usePropertyDocuments(id);
  const locksQuery = useLocks();
  const { backButton, mainButton } = useTelegram();
  const ton = useTonConnect();
  const buy = useBuyShares();
  const router = useRouter();
  const setMainButtonActive = useUiStore((s) => s.setMainButtonActive);
  const settingsOpen = useUiStore((s) => s.settingsOpen);
  const pushToast = useUiStore((s) => s.pushToast);

  /** null = untouched — derives from owned shares once the portfolio loads (Phase 2 prefill). */
  const [previewShares, setPreviewShares] = useState<number | null>(null);
  const [qty, setQty] = useState(10);
  const [currency, setCurrency] = useState<BuyCurrency>("TON");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [step, setStep] = useState<BuySheetStep>("qty");
  /** Secondary-market sheets (Phase 7) — LimitBuy for Buy, SellSheet for Sell. */
  const [limitBuyOpen, setLimitBuyOpen] = useState(false);
  const [sellOpen, setSellOpen] = useState(false);
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

  // Ownership prefill — REDESIGN-SPEC Phase 2: slider starts at owned shares (min 1).
  // Derived (not an effect): untouched state follows ownership until the user edits it.
  const ownedShares = portfolio.data?.holdings.find((h) => h.propertyId === id)?.sharesOwned ?? 0;
  // Phase 6 — locked subset for this property (active locks only).
  const activeLocks = activeLocksForProperty(locksQuery.data?.locks, id);
  const lockedShares = activeLocks.reduce((sum, lock) => sum + lock.shares, 0);
  // Phase 3 — display-only accrued unpaid yield across this property's active locks.
  const accruedUnpaidUsd = activeLocks.reduce((sum, lock) => sum + lock.accruedUnpaidUsd, 0);
  const avgCostUsd = portfolio.data?.holdings.find((h) => h.propertyId === id)?.avgCostUsd;
  const effectivePreviewShares = previewShares ?? Math.max(1, ownedShares);
  const freeShares = Math.max(0, ownedShares - lockedShares);
  const mainButtonActive = useUiStore((s) => s.mainButtonActive);
  const setStickyCtaVisible = useUiStore((s) => s.setStickyCtaVisible);
  // Sticky bar appears only after the hero (with its own CTA) scrolls away — CTA fixes #2.
  const heroPassed = useScrolledPast("property-hero", !sheetOpen);
  const stickyVisible = !sheetOpen && !limitBuyOpen && !sellOpen && heroPassed;

  // Compact top bar (#07b) — direction-aware: appears on scroll-up once the user
  // is past the hero area (threshold ≈ hero height), hides on scroll-down or while
  // any sheet owns the screen (no conflict with Telegram MainButton chrome).
  const scrolledUp = useScrollDirection(320);
  const compactBarVisible =
    Boolean(listing) && !sheetOpen && !limitBuyOpen && !sellOpen && !settingsOpen && heroPassed && scrolledUp;

  // Floating chrome (demo badge) must yield while the sticky CTA occupies the zone.
  useEffect(() => {
    setStickyCtaVisible(stickyVisible && Boolean(listing));
    return () => setStickyCtaVisible(false);
  }, [stickyVisible, listing, setStickyCtaVisible]);

  // Single source of truth for "current share price" (lib/property-price).
  const currentPriceUsd = listing
    ? getCurrentSharePrice(listing, { bestAskUsd: orderBook.data?.bestAskUsd })
    : 0;

  // Single buy entry — hero CTA, sticky CTA, calculator and MainButton all route here.
  // Primary offering opens the TON/USDT BuySheet; a secondary listing opens the
  // market (limit) buy sheet anchored to the best ask (Phase 7).
  const openBuyForContext = useCallback((n?: number) => {
    if (!listing) return;
    if (listing.status === "funding") {
      if (remaining <= 0) return;
      haptics.impact("light");
      setQty(Math.min(remaining, Math.max(1, n ?? effectivePreviewShares)));
      setCurrency("TON");
      setStep("qty");
      setSheetOpen(true);
      return;
    }
    haptics.impact("light");
    setLimitBuyOpen(true);
  }, [listing, remaining, effectivePreviewShares]);

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
        // Secondary sheets (limit buy / sell / lock / confirmations) — close the
        // topmost sheet instead of abandoning the page with a half-finished form.
        if (limitBuyOpen || sellOpen) {
          setLimitBuyOpen(false);
          setSellOpen(false);
          return;
        }
        if (closeTopSheet()) return;
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
  }, [sheetOpen, step, closeSheet, router, backButton, settingsOpen, limitBuyOpen, sellOpen]);

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
        pushToast("error", "Buy failed", res.error);
        haptics.notification("error");
      }
    } catch (e) {
      // USDT not configured on the server → fall back to TON and tell the user.
      if (e instanceof UsdtUnavailableError) {
        setCurrency("TON");
        setUsdtAvailable(false);
        setBuyError(e.message);
        pushToast("error", "USDT unavailable", "Switching you to TON for this purchase.");
        haptics.notification("error");
        return;
      }
      const message = e instanceof Error ? e.message : "transaction rejected";
      setBuyError(message);
      pushToast("error", "Buy failed", message);
      haptics.notification("error");
    }
  }, [listing, qty, currency, buy, pushToast]);

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
        text: tCommon("acquireOwnership"),
        isEnabled: true,
        color: "#229ED9",
        textColor: "#ffffff",
      });
      const off = mainButton.onClick(() => {
        haptics.impact("light");
        openBuyForContext();
      });return () => {
        off();
      };
    }

    // Sheet open — qty / summary
    setMainButtonActive(true);

    if (!ton.connected) {
      mainButton.setParams({
        text: tCommon("connectWallet"),
        isEnabled: true,
        color: "#229ED9",
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
        color: "#229ED9",
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
        color: "#229ED9",
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
    effectivePreviewShares,
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
      {/* Compact top bar (#07b) — back + property name on scroll-up past the hero. */}
      <PropertyCompactTopBar title={listing.title} visible={compactBarVisible} />
      {/* Tight CTA clearance (#08): 96px = 52px sticky bar + scrim + breathing room.
          The AppShell's own bottom inset (88px + safe area) remains as the
          Telegram-chrome clearance — no excess blank block. */}
      <div className={!sheetOpen ? "pb-24" : undefined}>
        <PropertyDetail
          listing={listing}
          orderBook={orderBook.data}
          onBuy={() => openBuyForContext()}
          previewShares={effectivePreviewShares}
          onSharesChange={setPreviewShares}
          ownedShares={ownedShares}
          lockedShares={lockedShares}
          avgCostUsd={avgCostUsd}
          accruedUnpaidUsd={accruedUnpaidUsd}
          onBuyShares={(n) => openBuyForContext(n)}
          stay={stayQuery.data}
          documents={documents}
          onDownloadDoc={(docId) => docDownload.mutate(docId)}
          downloadingDocId={docDownload.isPending ? String(docDownload.variables) : null}
          documentsError={docDownload.error instanceof Error ? docDownload.error.message : null}
        />
      </div>
      {/* Sticky CTA reveals only once the hero CTA has scrolled out of view.
          Tab bar is hidden while the Telegram MainButton is active (ui.store) —
          when it is visible we lift the bar above it. */}
      {!stickyVisible ? null : (
        <PropertyStickyCta
          variant={listing.status === "funding" ? "primary" : "secondary"}
          priceUsd={currentPriceUsd}
          onBuy={() => openBuyForContext()}
          buyDisabled={listing.status === "funding" && remaining <= 0}
          onSell={
            listing.status !== "funding" && freeShares > 0
              ? () => {
                  haptics.impact("light");
                  setSellOpen(true);
                }
              : undefined
          }
          navOffset={!mainButtonActive}
        />
      )}
      <BuySheet        open={sheetOpen}
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
        unitPriceUsd={currentPriceUsd}
      />
      {/* Phase 7 — secondary market sheets (conditionally mounted: their hooks only run when open) */}
      {limitBuyOpen ? (
        <LimitBuySheet
          open
          onClose={() => setLimitBuyOpen(false)}
          listing={listing}
          orderBook={orderBook.data}
        />
      ) : null}
      {sellOpen ? (
        <SellSheet
          open
          onClose={() => setSellOpen(false)}
          listing={listing}
          freeShares={freeShares}
          avgCostUsd={avgCostUsd ?? listing.sharePriceUsd}
        />
      ) : null}
    </>
  );
}
