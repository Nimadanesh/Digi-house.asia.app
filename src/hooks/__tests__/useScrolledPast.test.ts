import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useScrolledPast } from "@/hooks/useScrolledPast";

type IOCallback = (entries: { isIntersecting: boolean }[]) => void;

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  callback: IOCallback;
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor(cb: IOCallback) {
    this.callback = cb;
    FakeIntersectionObserver.instances.push(this);
  }
}

describe("useScrolledPast", () => {
  beforeEach(() => {
    FakeIntersectionObserver.instances = [];
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts false and flips once the element leaves the viewport", () => {
    document.body.innerHTML = '<div data-testid="property-hero"></div>';
    const { result } = renderHook(() => useScrolledPast("property-hero"));
    expect(result.current).toBe(false);

    act(() => {
      FakeIntersectionObserver.instances[0].callback([{ isIntersecting: false }]);
    });
    expect(result.current).toBe(true);

    act(() => {
      FakeIntersectionObserver.instances[0].callback([{ isIntersecting: true }]);
    });
    expect(result.current).toBe(false);
  });

  it("does not observe when disabled", () => {
    document.body.innerHTML = '<div data-testid="property-hero"></div>';
    const { result } = renderHook(() => useScrolledPast("property-hero", false));
    expect(FakeIntersectionObserver.instances).toHaveLength(0);
    expect(result.current).toBe(false);
  });
});
