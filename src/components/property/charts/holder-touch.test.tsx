// File responsibility: touch-interaction contract for the Ownership charts —
// first tap selects persistently (survives finger lift), tapping another point
// moves the selection, re-tapping toggles off, desktop hover stays transient.
// Pure interaction layer: no dataset, economics, or visual assertions beyond
// the selected-state markers the fix introduces.
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HolderDonut } from "@/components/property/charts/HolderDonut";
import { TopHoldersBar } from "@/components/property/charts/TopHoldersBar";
import { OwnershipTreemap } from "@/components/property/charts/OwnershipTreemap";
import { DistributionOverTime } from "@/components/property/charts/DistributionOverTime";
import { HolderBubbleChart } from "@/components/property/charts/HolderBubbleChart";
import { HitZones, useHitZones } from "@/components/property/charts/shared";
import type { HolderBucket, OwnershipPoint } from "@/lib/property-analytics";

const buckets: HolderBucket[] = [
  { label: "holder.A", shares: 4000, weightBps: 4000 },
  { label: "holder.B", shares: 3000, weightBps: 3000 },
  { label: "holder.C", shares: 2000, weightBps: 2000 },
  { label: "holder.D", shares: 1000, weightBps: 1000 },
];

function history(n: number): OwnershipPoint[] {
  return Array.from({ length: n }, (_, i) => ({
    at: new Date(Date.UTC(2025, 0, 1) + i * 7 * 24 * 3600 * 1000).toISOString(),
    buckets,
    holderCount: 42,
  }));
}

/** Mobile tap: down+up without drag, then the leave the browser fires on lift. */
function touchTap(el: Element) {
  fireEvent.pointerOver(el, { pointerType: "touch" });
  fireEvent.pointerDown(el, { pointerType: "touch", clientX: 10, clientY: 10 });
  fireEvent.pointerUp(el, { pointerType: "touch", clientX: 10, clientY: 10 });
  fireEvent.pointerOut(el, { pointerType: "touch" });
}

function mouseHover(el: Element) {
  fireEvent.pointerOver(el, { pointerType: "mouse" });
}

function mouseLeave(el: Element) {
  fireEvent.pointerOut(el, { pointerType: "mouse" });
}

describe("HolderDonut touch selection", () => {
  it("desktop hover shows the segment and leaving clears it", () => {
    render(<HolderDonut holders={buckets} totalShares={10000} holderCount={42} />);
    const seg = screen.getByTestId("donut-seg-0");
    mouseHover(seg);
    expect(screen.getByTestId("donut-tooltip")).toHaveTextContent("4,000");
    mouseLeave(seg);
    expect(screen.getByTestId("donut-tooltip")).toHaveTextContent("Tap a segment for details");
  });

  it("touch tap persists after finger lift", () => {
    render(<HolderDonut holders={buckets} totalShares={10000} holderCount={42} />);
    touchTap(screen.getByTestId("donut-seg-0"));
    expect(screen.getByTestId("donut-tooltip")).toHaveTextContent("4,000");
  });

  it("tapping another segment moves the selection", () => {
    render(<HolderDonut holders={buckets} totalShares={10000} holderCount={42} />);
    touchTap(screen.getByTestId("donut-seg-0"));
    touchTap(screen.getByTestId("donut-seg-1"));
    expect(screen.getByTestId("donut-tooltip")).toHaveTextContent("3,000");
  });

  it("re-tapping the selected segment toggles it off", () => {
    render(<HolderDonut holders={buckets} totalShares={10000} holderCount={42} />);
    const seg = screen.getByTestId("donut-seg-0");
    touchTap(seg);
    expect(screen.getByTestId("donut-tooltip")).toHaveTextContent("4,000");
    touchTap(seg);
    expect(screen.getByTestId("donut-tooltip")).toHaveTextContent("Tap a segment for details");
  });
});

describe("OwnershipTreemap touch selection", () => {
  it("desktop hover shows the cell and leaving clears it", () => {
    render(<OwnershipTreemap holders={buckets} totalShares={10000} />);
    const cell = screen.getByTestId("treemap-cell-A");
    mouseHover(cell);
    expect(screen.getByTestId("treemap-tooltip")).toHaveTextContent("4,000");
    mouseLeave(cell);
    expect(screen.getByTestId("treemap-tooltip")).toHaveTextContent("Tap a block for details");
  });

  it("touch tap persists, moves, and toggles off", () => {
    render(<OwnershipTreemap holders={buckets} totalShares={10000} />);
    const cellA = screen.getByTestId("treemap-cell-A");
    touchTap(cellA);
    expect(screen.getByTestId("treemap-tooltip")).toHaveTextContent("4,000");
    touchTap(screen.getByTestId("treemap-cell-B"));
    expect(screen.getByTestId("treemap-tooltip")).toHaveTextContent("3,000");
    touchTap(screen.getByTestId("treemap-cell-B"));
    expect(screen.getByTestId("treemap-tooltip")).toHaveTextContent("Tap a block for details");
  });
});

describe("HolderBubbleChart touch selection", () => {
  // Bubbles overlap by design, so touch taps resolve to the nearest bubble
  // center at the svg level. jsdom has no layout — provide the viewBox-scale
  // rect explicitly (bubble A sits at the 440×220 center: 220,110).
  function tapSvg(svg: Element, x: number, y: number) {
    vi.spyOn(svg, "getBoundingClientRect").mockReturnValue({
      left: 0, top: 0, width: 440, height: 220, right: 440, bottom: 220, x: 0, y: 0,
      toJSON: () => {},
    } as DOMRect);
    fireEvent.pointerDown(svg, { pointerType: "touch", clientX: x, clientY: y });
    fireEvent.pointerUp(svg, { pointerType: "touch", clientX: x, clientY: y });
  }

  it("desktop hover shows the bubble and leaving clears it", () => {
    render(<HolderBubbleChart holders={buckets} totalShares={10000} />);
    const bubble = screen.getByTestId("bubble-A");
    mouseHover(bubble);
    expect(screen.getByTestId("bubble-tooltip")).toHaveTextContent("4,000");
    mouseLeave(bubble);
    expect(screen.getByTestId("bubble-tooltip")).toHaveTextContent("Tap a bubble for details");
  });

  it("touch tap persists, moves, and toggles off", () => {
    render(<HolderBubbleChart holders={buckets} totalShares={10000} />);
    const svg = screen.getByTestId("bubble-svg");
    tapSvg(svg, 220, 110); // bubble A center
    expect(screen.getByTestId("bubble-tooltip")).toHaveTextContent("4,000");
    // Bubble B sits nearest to (192,126) per the golden-angle spiral.
    tapSvg(svg, 192, 126);
    expect(screen.getByTestId("bubble-tooltip")).toHaveTextContent("3,000");
    tapSvg(svg, 192, 126);
    expect(screen.getByTestId("bubble-tooltip")).toHaveTextContent("Tap a bubble for details");
  });

  it("small bubbles get an enlarged invisible hit area", () => {
    const { container } = render(<HolderBubbleChart holders={buckets} totalShares={10000} />);
    const hit = container.querySelector('[data-testid="bubble-D"] circle[fill="transparent"]');
    expect(hit).not.toBeNull();
  });
});

describe("DistributionOverTime touch selection", () => {
  it("touch tap persists with a selected-week marker; another tap moves it", () => {
    render(<DistributionOverTime history={history(52)} />);
    touchTap(screen.getByTestId("chart-hit-10"));
    expect(screen.getByTestId("distribution-selected-marker")).toBeInTheDocument();
    const first = screen.getByTestId("distribution-tooltip").textContent;
    touchTap(screen.getByTestId("chart-hit-20"));
    expect(screen.getByTestId("distribution-selected-marker")).toBeInTheDocument();
    expect(screen.getByTestId("distribution-tooltip").textContent).not.toBe(first);
  });

  it("desktop hover shows the week without a persistent marker", () => {
    render(<DistributionOverTime history={history(52)} />);
    const zone = screen.getByTestId("chart-hit-5");
    mouseHover(zone);
    expect(screen.queryByTestId("distribution-selected-marker")).not.toBeInTheDocument();
    mouseLeave(zone);
    expect(screen.getByTestId("distribution-tooltip")).toHaveTextContent("Tap the chart for details at that date");
  });

  it("changing range clears a stale selection", () => {
    render(<DistributionOverTime history={history(52)} />);
    touchTap(screen.getByTestId("chart-hit-50"));
    expect(screen.getByTestId("distribution-selected-marker")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("dist-range-1M"));
    expect(screen.queryByTestId("distribution-selected-marker")).not.toBeInTheDocument();
  });

  it("re-tapping the selected week toggles it off", () => {
    render(<DistributionOverTime history={history(52)} />);
    const zone = screen.getByTestId("chart-hit-10");
    touchTap(zone);
    expect(screen.getByTestId("distribution-selected-marker")).toBeInTheDocument();
    touchTap(zone);
    expect(screen.queryByTestId("distribution-selected-marker")).not.toBeInTheDocument();
  });
});

describe("TopHoldersBar is interaction-free (all data always visible)", () => {
  it("renders every bucket with shares and percentage — nothing to tap", () => {
    render(<TopHoldersBar holders={buckets} totalShares={10000} />);
    expect(screen.getByTestId("holder-row-0")).toHaveTextContent("4,000");
    expect(screen.getByTestId("holder-row-1")).toHaveTextContent("3,000");
    expect(screen.getByTestId("holder-row-2")).toHaveTextContent("2,000");
    expect(screen.getByTestId("holder-row-3")).toHaveTextContent("1,000");
  });
});

function LegacyZones({ count, onIndex }: { count: number; onIndex: (i: number | null) => void }) {
  const xs = useHitZones(count);
  return (
    <svg>
      {/* Legacy contract (IncomeAnalytics): hover-only, no onSelect. */}
      <HitZones xs={xs} onIndex={onIndex} />
    </svg>
  );
}

describe("HitZones legacy contract (IncomeAnalytics) is unchanged", () => {
  it("without onSelect, any pointer down reports and any leave clears", () => {
    const onIndex = vi.fn();
    render(<LegacyZones count={4} onIndex={onIndex} />);
    const zone = screen.getByTestId("chart-hit-2");
    fireEvent.pointerOver(zone, { pointerType: "touch" });
    expect(onIndex).toHaveBeenLastCalledWith(2);
    fireEvent.pointerDown(zone, { pointerType: "touch" });
    expect(onIndex).toHaveBeenLastCalledWith(2);
    fireEvent.pointerOut(zone, { pointerType: "touch" });
    expect(onIndex).toHaveBeenLastCalledWith(null);
  });
});
