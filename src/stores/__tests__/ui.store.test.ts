import { describe, it, expect, beforeEach } from "vitest";
import { useUiStore } from "@/stores/ui.store";

describe("ui.store — mainButtonActive flag", () => {
  beforeEach(() => {
    useUiStore.setState({ mainButtonActive: false });
  });

  it("defaults to false", () => {
    expect(useUiStore.getState().mainButtonActive).toBe(false);
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
});