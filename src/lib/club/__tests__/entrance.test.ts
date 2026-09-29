import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  CLUB_ENTRANCE_REDUCED_END,
  CLUB_ENTRANCE_TIMELINE,
  consumeClubEntrance,
  createClubAmbientCanvas,
  createClubEntranceCanvas,
  hasPendingClubEntrance,
  requestClubEntrance,
  subscribeClubEntrance,
} from "@/lib/club/entrance";

describe("Club entrance timeline", () => {
  it("targets the refined ~10 second experience", () => {
    expect(CLUB_ENTRANCE_TIMELINE.end).toBeGreaterThanOrEqual(9000);
    expect(CLUB_ENTRANCE_TIMELINE.end).toBeLessThanOrEqual(11000);
  });

  it("orders its phases monotonically", () => {
    const { ambientIn, convergeStart, convergeEnd, end } = CLUB_ENTRANCE_TIMELINE;
    expect(ambientIn).toBeLessThan(convergeStart);
    expect(convergeStart).toBeLessThan(convergeEnd);
    expect(convergeEnd).toBeLessThan(end);
  });

  it("reduced motion leaves much sooner", () => {
    expect(CLUB_ENTRANCE_REDUCED_END).toBeLessThan(CLUB_ENTRANCE_TIMELINE.end);
  });
});

describe("Club entrance signal", () => {
  beforeEach(() => {
    consumeClubEntrance();
  });

  it("starts idle and arms on request", () => {
    expect(hasPendingClubEntrance()).toBe(false);
    requestClubEntrance();
    expect(hasPendingClubEntrance()).toBe(true);
  });

  it("notifies subscribers on request and consume", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeClubEntrance(listener);
    requestClubEntrance();
    expect(listener).toHaveBeenCalledTimes(1);
    consumeClubEntrance();
    expect(listener).toHaveBeenCalledTimes(2);
    expect(hasPendingClubEntrance()).toBe(false);
    unsubscribe();
  });

  it("stops notifying after unsubscribe", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeClubEntrance(listener);
    unsubscribe();
    requestClubEntrance();
    expect(listener).not.toHaveBeenCalled();
  });
});

describe("createClubEntranceCanvas", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("is a safe no-op without a 2D context", () => {
    const canvas = document.createElement("canvas");
    vi.spyOn(canvas, "getContext").mockReturnValue(null);
    const handle = createClubEntranceCanvas(canvas, { reducedMotion: true });
    expect(() => handle.destroy()).not.toThrow();
    expect(() => handle.destroy()).not.toThrow();
  });

  it("the ambient field degrades safely without a 2D context", () => {
    const canvas = document.createElement("canvas");
    vi.spyOn(canvas, "getContext").mockReturnValue(null);
    const handle = createClubAmbientCanvas(canvas, { reducedMotion: false });
    expect(() => handle.destroy()).not.toThrow();
  });
});
