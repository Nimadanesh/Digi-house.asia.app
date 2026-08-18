import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import fa from "../../../messages/fa.json";

const faMessages = fa as Record<string, unknown>;

function lookup(path: string): string | undefined {
  const parts = path.split(".");
  let cur: unknown = faMessages;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === "string" ? cur : undefined;
}

vi.mock("next-intl", () => ({
  useTranslations: (namespace?: string) => (key: string) => {
    const path = namespace ? `${namespace}.${key}` : key;
    return lookup(path) ?? key;
  },
  useLocale: () => "fa",
  NextIntlClientProvider: ({ children }: { children: unknown }) => children,
}));

import { OnboardingCarousel } from "./OnboardingCarousel";

const noop = () => {};

function renderRtl(index: number) {
  return render(
    <OnboardingCarousel index={index} onIndexChange={noop} onSwipeHaptic={noop} />,
  );
}

describe("OnboardingCarousel (RTL / Persian)", () => {
  it("slide 2 and 3 are reachable: track must not reverse-stack against the positive RTL translate", () => {
    const { container } = renderRtl(2);
    const track = container.querySelector('[data-testid="onboarding-track"]');
    // RTL flow is right-to-left natively; adding flex-row-reverse would push the
    // positive translateX the wrong way and blank out slides 2–3.
    expect(track).not.toHaveClass("flex-row-reverse");
    expect(track?.getAttribute("style")).toContain("translateX(200%)");
    expect(screen.getByTestId("onboarding-slide-sell")).toBeInTheDocument();
  });

  it("shows translated Persian text on slide 3", () => {
    renderRtl(2);
    const headline = lookup("onboarding.sell.headline");
    const subtitle = lookup("onboarding.sell.subtitle");
    expect(headline).toBeDefined();
    expect(screen.getAllByText(headline!).length).toBeGreaterThan(0);
    expect(screen.getAllByText(subtitle!).length).toBeGreaterThan(0);
  });
});