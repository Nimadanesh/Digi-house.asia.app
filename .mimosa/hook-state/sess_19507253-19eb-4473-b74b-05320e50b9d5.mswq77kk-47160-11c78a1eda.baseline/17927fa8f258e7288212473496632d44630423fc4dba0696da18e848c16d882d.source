import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => {
  const mk = (available: boolean) => {
    const fn = vi.fn();
    (fn as unknown as { isAvailable: () => boolean }).isAvailable = () => available;
    return fn;
  };
  return {
    show: mk(false),
    hide: mk(false),
    mount: mk(false),
    onClick: mk(false),
    offClick: mk(false),
    setParams: mk(false),
    mainOnClick: mk(false),
    mainOffClick: mk(false),
  };
});

vi.mock("@/lib/telegram/signals", () => ({
  isTMA: () => false,
  backButton: {
    show: mocks.show,
    hide: mocks.hide,
    mount: mocks.mount,
    onClick: mocks.onClick,
    offClick: mocks.offClick,
  },
  mainButton: {
    setParams: mocks.setParams,
    onClick: mocks.mainOnClick,
    offClick: mocks.mainOffClick,
  },
}));

import { safeBackButton, safeMainButton } from "@/lib/telegram/chrome";

describe("safe Telegram chrome (localhost / outside Mini Apps)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // re-attach isAvailable after clearAllMocks
    for (const fn of Object.values(mocks)) {
      (fn as unknown as { isAvailable: () => boolean }).isAvailable = () => false;
    }
  });

  it("does not call backButton.hide when not available", () => {
    expect(() => safeBackButton.hide()).not.toThrow();
    expect(mocks.hide).not.toHaveBeenCalled();
  });

  it("does not call backButton.show when not available", () => {
    expect(() => safeBackButton.show()).not.toThrow();
    expect(mocks.show).not.toHaveBeenCalled();
  });

  it("onClick returns a no-op unsubscribe when unavailable", () => {
    const off = safeBackButton.onClick(() => {});
    expect(typeof off).toBe("function");
    expect(() => off()).not.toThrow();
    expect(mocks.onClick).not.toHaveBeenCalled();
  });

  it("mainButton setParams/hide no-op when unavailable", () => {
    expect(() => safeMainButton.setParams({ text: "Go" })).not.toThrow();
    expect(() => safeMainButton.hide()).not.toThrow();
    expect(mocks.setParams).not.toHaveBeenCalled();
  });

  it("invokes hide when isAvailable() is true", () => {
    (mocks.hide as unknown as { isAvailable: () => boolean }).isAvailable = () => true;
    safeBackButton.hide();
    expect(mocks.hide).toHaveBeenCalledTimes(1);
  });

  it("show works when method is unbound (no this.mount crash)", () => {
    (mocks.mount as unknown as { isAvailable: () => boolean }).isAvailable = () => true;
    (mocks.show as unknown as { isAvailable: () => boolean }).isAvailable = () => true;
    const show = safeBackButton.show;
    expect(() => show()).not.toThrow();
    expect(mocks.show).toHaveBeenCalled();
  });
});
