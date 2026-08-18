// File responsibility: the recurring inline weekly-yield line (cards, detail, portfolio).
// DESIGN_SYSTEM "Weekly-yield callout": --success text + CalendarClock 16px. Static idle state.
import { CalendarClock } from "lucide-react";
import { usd } from "@/lib/format";

export function WeeklyYieldCallout({ weeklyPerShare }: { weeklyPerShare: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-success text-sm">
      <CalendarClock size={16} strokeWidth={1.75} aria-hidden />
      <span className="tnum font-medium">≈ {usd(weeklyPerShare)} / week per share</span>
    </span>
  );
}