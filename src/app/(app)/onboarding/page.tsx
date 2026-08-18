"use client";
// File responsibility: first-launch onboarding screen (Fable Onboarding).
// MainButton: Continue (slides 1–2) / Get Started (last). In-page Start on last slide. Skip top-right.
// Plays a brief Braille Flipwave splash once before revealing the carousel.
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTelegram } from "@/hooks/useTelegram";
import { useTelegramBackButton } from "@/hooks/useTelegramBackButton";
import { useMarkOnboarded } from "@/hooks/useMarkOnboarded";
import { useAuthStore } from "@/stores/auth.store";
import { useUiStore } from "@/stores/ui.store";
import { haptics } from "@/lib/telegram/haptics";
import { ROUTES } from "@/lib/constants";
import { ONBOARDING_SLIDE_COUNT } from "@/lib/onboarding-slides";
import { OnboardingCarousel } from "@/components/onboarding/OnboardingCarousel";
import { OnboardingLoader } from "@/components/onboarding/OnboardingLoader";

export default function OnboardingPage() {
  const t = useTranslations("onboarding");
  const router = useRouter();
  const { mainButton, backButton } = useTelegram();
  const markOnboarded = useMarkOnboarded();
  const profileCompleted = useAuthStore((s) => s.user?.profileCompleted);
  const setMainButtonActive = useUiStore((s) => s.setMainButtonActive);
  const setOnboardingReplay = useUiStore((s) => s.setOnboardingReplay);
  const [index, setIndex] = useState(0);
  const [splashDone, setSplashDone] = useState(false);
  const isLast = index >= ONBOARDING_SLIDE_COUNT - 1;

  const complete = useCallback(() => {
    haptics.notification("success");
    markOnboarded();
    setOnboardingReplay(false);
    setMainButtonActive(false);
    mainButton.hide();
    router.replace(profileCompleted === false ? ROUTES.profileSetup : ROUTES.home);
  }, [router, markOnboarded, setOnboardingReplay, setMainButtonActive, mainButton, profileCompleted]);

  useTelegramBackButton(
    splashDone ? index : 0,
    useCallback(() => setIndex((i) => Math.max(0, i - 1)), []),
  );

  useEffect(() => {
    if (!splashDone) return;
    setMainButtonActive(true);
    mainButton.setParams({
      text: isLast ? t("getStarted") : t("continue"),
      isEnabled: true,
      color: "#3390ec",
      textColor: "#ffffff",
    });
    const off = mainButton.onClick(() => {
      haptics.impact("medium");
      if (isLast) complete();
      else setIndex((i) => Math.min(ONBOARDING_SLIDE_COUNT - 1, i + 1));
    });
    return () => {
      off();
    };
  }, [complete, isLast, splashDone, setMainButtonActive, t, mainButton]);

  useEffect(() => {
    return () => {
      setMainButtonActive(false);
      mainButton.hide();
      backButton.hide();
    };
  }, [mainButton, backButton, setMainButtonActive]);

  if (!splashDone) {
    return (
      <div
        className="flex min-h-[calc(100svh-120px)] flex-col"
        data-testid="onboarding-page"
      >
        <OnboardingLoader onComplete={() => setSplashDone(true)} />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100svh-120px)] flex-col" data-testid="onboarding-page">
      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={() => {
            haptics.selection();
            complete();
          }}
          className="min-h-[44px] px-2 text-sm font-medium text-primary active:scale-[0.97] transition-transform duration-[120ms] ease-out"
          data-testid="onboarding-skip"
        >
          {t("skip")}
        </button>
      </div>

      <OnboardingCarousel
        index={index}
        onIndexChange={setIndex}
        onSwipeHaptic={() => haptics.selection()}
      />

      {isLast ? (
        <div className="px-2 pb-3">
          <button
            type="button"
            onClick={() => {
              haptics.impact("medium");
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
