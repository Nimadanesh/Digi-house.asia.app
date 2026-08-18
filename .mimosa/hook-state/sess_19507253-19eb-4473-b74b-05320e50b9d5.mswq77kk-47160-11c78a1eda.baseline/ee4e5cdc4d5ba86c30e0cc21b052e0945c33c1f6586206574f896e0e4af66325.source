import { describe, it, expect, beforeEach } from "vitest";
import { useUiStore } from "@/stores/ui.store";

describe("ui.store — chrome flags", () => {
  beforeEach(() => {
    useUiStore.setState({
      mainButtonActive: false,
      settingsOpen: false,
      onboardingReplay: false,
    });
  });

  it("defaults to false", () => {
    expect(useUiStore.getState().mainButtonActive).toBe(false);
    expect(useUiStore.getState().settingsOpen).toBe(false);
    expect(useUiStore.getState().onboardingReplay).toBe(false);
  });

  it("setMainButtonActive(true) flips the flag", () => {
    useUiStore.getState().setMainButtonActive(true);
    expect(useUiStore.getState().mainButtonActive).toBe(true);
  });

  it("setMainButtonActive(false) clears the flag", () => {
    useUiStore.getState().setMainButtonActive(true);
    useUiStore.getState().setMainButtonActive(false);
    expect(useUiStore.getState().mainButtonActive).toBe(false);
  });

  it("setSettingsOpen toggles the settings sheet flag", () => {
    useUiStore.getState().setSettingsOpen(true);
    expect(useUiStore.getState().settingsOpen).toBe(true);
    useUiStore.getState().setSettingsOpen(false);
    expect(useUiStore.getState().settingsOpen).toBe(false);
  });

  it("setOnboardingReplay allows reopening onboarding", () => {
    useUiStore.getState().setOnboardingReplay(true);
    expect(useUiStore.getState().onboardingReplay).toBe(true);
  });
});
