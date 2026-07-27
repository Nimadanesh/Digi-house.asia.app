"use client";
// File responsibility: first-launch onboarding screen (Fable Onboarding).
// MainButton: Continue (slides 1–2) / Get Started (last). In-page Start on last slide. Skip top-right.
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTelegram } from "@/hooks/useTelegram";
import { useTelegramBackButton } from "@/hooks/useTelegramBackButton";
import { useSettingsStore } from "@/stores/settings.store";
import { useUiStore } from "@/stores/ui.store";
import { ROUTES } from "@/lib/constants";
import { ONBOARDING_SLIDE_COUNT } from "@/lib/onboarding-slides";
import { OnboardingCarousel } from "@/components/onboarding/OnboardingCarousel";

export default function OnboardingPage() {
  const t = useTranslations("onboarding");
  const router = useRouter();
  const tg = useTelegram();
  const setOnboarded = useSettingsStore((s) => s.setOnboarded);
  const setMainButtonActive = useUiStore((s) => s.setMainButtonActive);
  const setOnboardingReplay = useUiStore((s) => s.setOnboardingReplay);
  const [index, setIndex] = useState(0);
  const isLast = index >= ONBOARDING_SLIDE_COUNT - 1;

  const complete = useCallback(() => {
    tg.haptics.notification("success");
    setOnboarded(true);
    setOnboardingReplay(false);
    setMainButtonActive(false);
    tg.mainButton.hide();
    router.replace(ROUTES.home);
  }, [router, setOnboarded, setOnboardingReplay, setMainButtonActive, tg]);

  useTelegramBackButton(
    index,
    useCallback(() => setIndex((i) => Math.max(0, i - 1)), []),
  );

  useEffect(() => {
    setMainButtonActive(true);
    tg.mainButton.setParams({
      text: isLast ? t("getStarted") : t("continue"),
      isEnabled: true,
      color: "#3390ec",
      textColor: "#ffffff",
    });
    const off = tg.mainButton.onClick(() => {
      tg.haptics.impact("medium");
      if (isLast) complete();
      else setIndex((i) => Math.min(ONBOARDING_SLIDE_COUNT - 1, i + 1));
    });
    return () => {
      off();
    };
  }, [complete, isLast, setMainButtonActive, t, tg]);

  useEffect(() => {
    return () => {
      setMainButtonActive(false);
      tg.mainButton.hide();
      tg.backButton.hide();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-[calc(100svh-120px)] flex-col" data-testid="onboarding-page">
      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={() => {
            tg.haptics.selection();
            complete();
          }}
          className="min-h-[44px] px-2 text-sm font-medium text-primary active:opacity-80"
          data-testid="onboarding-skip"
        >
          {t("skip")}
        </button>
      </div>

      <OnboardingCarousel
        index={index}
        onIndexChange={setIndex}
        onSwipeHaptic={() => tg.haptics.selection()}
      />

      {isLast ? (
        <div className="px-2 pb-3">
          <button
            type="button"
            onClick={() => {
              tg.haptics.impact("medium");
              complete();
            }}
            className="inline-flex h-[52px] w-full items-center justify-center rounded-[12px] bg-primary text-[0.9375rem] font-semibold text-primary-foreground active:scale-[0.98] transition-transform duration-[120ms] ease-out"
            data-testid="onboarding-start"
          >
            {t("getStarted")}
          </button>
        </div>
      ) : null}

      <p className="pb-2 text-center text-[0.6875rem] text-muted-foreground tnum">
        {t("slideProgress", { current: index + 1, total: ONBOARDING_SLIDE_COUNT })}
      </p>
    </div>
  );
}
