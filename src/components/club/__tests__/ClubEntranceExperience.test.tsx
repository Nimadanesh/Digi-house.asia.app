import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import {
  CLUB_ENTRANCE_TIMELINE,
  consumeClubEntrance,
  requestClubEntrance,
} from "@/lib/club/entrance";
import { ClubEntranceExperience } from "@/components/club/ClubEntranceExperience";

const realMatchMedia = window.matchMedia;
// Lets the deferred arm microtask flush before assertions.
const flush = () => act(async () => {});

describe("ClubEntranceExperience", () => {
  beforeEach(() => {
    consumeClubEntrance();
    // jsdom has no canvas backend — the engine must degrade to a safe no-op.
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  });

  afterEach(() => {
    window.matchMedia = realMatchMedia;
    vi.useRealTimers();
    vi.restoreAllMocks();
    consumeClubEntrance();
  });

  it("arms as the first state when Club is requested, before any route resolves", async () => {
    // Request before mount — the pre-subscription race must still arm.
    requestClubEntrance();
    render(<ClubEntranceExperience />);
    await flush();
    expect(screen.getByTestId("club-entrance")).toBeInTheDocument();
    // Reuses existing Club copy + the Latin brand mark.
    expect(screen.getByText("Private Club")).toBeInTheDocument();
    expect(screen.getByText("FractionalLuxe")).toBeInTheDocument();
  });

  it("arms immediately on request — no route gating, so Club can never flash first", async () => {
    render(<ClubEntranceExperience />);
    expect(screen.queryByTestId("club-entrance")).not.toBeInTheDocument();
    await act(async () => {
      requestClubEntrance();
    });
    expect(screen.getByTestId("club-entrance")).toBeInTheDocument();
  });

  it("renders nothing when there is no pending request", async () => {
    render(<ClubEntranceExperience />);
    await flush();
    expect(screen.queryByTestId("club-entrance")).not.toBeInTheDocument();
  });

  it("always unmounts after the failsafe (Club is never trapped)", async () => {
    vi.useFakeTimers();
    requestClubEntrance();
    render(<ClubEntranceExperience />);
    await flush();
    expect(screen.getByTestId("club-entrance")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(CLUB_ENTRANCE_TIMELINE.end + 100);
    });
    expect(screen.queryByTestId("club-entrance")).not.toBeInTheDocument();
  });

  it("still renders and leaves promptly under reduced motion", async () => {
    vi.useFakeTimers();
    window.matchMedia = ((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
    requestClubEntrance();
    render(<ClubEntranceExperience />);
    await flush();
    expect(screen.getByTestId("club-entrance")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.queryByTestId("club-entrance")).not.toBeInTheDocument();
  });
});
