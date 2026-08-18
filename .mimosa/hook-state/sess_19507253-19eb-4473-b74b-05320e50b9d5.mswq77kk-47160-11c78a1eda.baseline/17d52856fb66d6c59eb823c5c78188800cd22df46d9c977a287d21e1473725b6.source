import { describe, it, expect, beforeEach } from "vitest";
import { useSettingsStore } from "@/stores/settings.store";

describe("settings.store — display currency + demo badge", () => {
  beforeEach(() => {
    useSettingsStore.setState({
      displayCurrency: "usd",
      useTelegramTheme: false,
      onboarded: false,
      role: null,
      showDemoBadge: true,
      locale: null,
    });
  });

  it("defaults displayCurrency to usd", () => {
    expect(useSettingsStore.getState().displayCurrency).toBe("usd");
  });

  it("defaults locale to null (auto) and can set fa", () => {
    expect(useSettingsStore.getState().locale).toBeNull();
    useSettingsStore.getState().setLocale("fa");
    expect(useSettingsStore.getState().locale).toBe("fa");
  });

  it("setDisplayCurrency switches to ton", () => {
    useSettingsStore.getState().setDisplayCurrency("ton");
    expect(useSettingsStore.getState().displayCurrency).toBe("ton");
  });

  it("defaults showDemoBadge to true and can hide", () => {
    expect(useSettingsStore.getState().showDemoBadge).toBe(true);
    useSettingsStore.getState().setShowDemoBadge(false);
    expect(useSettingsStore.getState().showDemoBadge).toBe(false);
  });
});
