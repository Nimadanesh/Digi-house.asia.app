import { Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "success" | "error";
const TONE: Record<Tone, { icon: typeof Check; bar: string; fg: string }> = {
  success: { icon: Check, bar: "border-l-2 border-l-success", fg: "text-foreground" },
  error: { icon: AlertCircle, bar: "border-l-2 border-l-danger", fg: "text-foreground" },
};

// Toast — DESIGN_SYSTEM §"Toast / Snackbar". Presentational; the caller owns mount + auto-dismiss.
// Enter via CSS @starting-style (200ms ease-out); exit driven by the `leaving` prop switching the
// visible state (160ms). See `.toast-card` in globals.css. Caller owns the two-stage timer so this
// component stays free of any lifetime logic.
export function Toast({
  tone,
  title,
  sub,
  leaving = false,
}: {
  tone: Tone;
  title: string;
  sub?: string;
  leaving?: boolean;
}) {
  const { icon: Icon, bar, fg } = TONE[tone];
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 flex justify-center z-50",
        "mt-[max(env(safe-area-inset-top),8px)]",
      )}
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
    >
      <div
        className={cn(
          "toast-card pointer-events-auto flex items-start gap-2 bg-card border border-border rounded-[10px] px-4 py-3 text-sm shadow-[0_2px_12px_rgba(0,0,0,0.18)]",
          "opacity-100 translate-y-0",
          leaving && "opacity-0 -translate-y-1",
          bar,
          fg,
        )}
        style={{ ["--toast-duration" as string]: leaving ? "160ms" : "200ms" }}
      >
        <Icon
          size={18}
          strokeWidth={1.75}
          className={cn("mt-0.5 shrink-0", tone === "success" ? "text-success" : "text-danger")}
          aria-hidden
        />
        <div className="flex flex-col gap-1">
          <span className="font-medium leading-snug">{title}</span>
          {sub ? (
            <span className="text-xs leading-relaxed text-muted-foreground tnum">{sub}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}