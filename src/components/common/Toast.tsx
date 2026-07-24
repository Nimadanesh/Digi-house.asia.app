import { Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "success" | "error";
const TONE: Record<Tone, { icon: typeof Check; bar: string; fg: string }> = {
  success: { icon: Check, bar: "border-l-2 border-l-success", fg: "text-foreground" },
  error: { icon: AlertCircle, bar: "border-l-2 border-l-danger", fg: "text-foreground" },
};

export function Toast({ tone, title, sub }: { tone: Tone; title: string; sub?: string }) {
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
          "pointer-events-auto flex items-start gap-2 bg-card border border-border rounded-[10px] px-4 py-3 text-sm shadow-[0_2px_12px_rgba(0,0,0,0.18)]",
          bar,
          fg,
        )}
      >
        <Icon
          size={18}
          strokeWidth={1.75}
          className={cn("mt-0.5 shrink-0", tone === "success" ? "text-success" : "text-danger")}
          aria-hidden
        />
        <div className="flex flex-col">
          <span className="font-medium">{title}</span>
          {sub ? <span className="text-xs text-muted-foreground tnum">{sub}</span> : null}
        </div>
      </div>
    </div>
  );
}