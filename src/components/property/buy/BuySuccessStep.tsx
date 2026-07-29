"use client";
// File responsibility: buy success step (Fable Buy Flow §Step 3). Confetti is CSS pulses only;
// honesty disclaimer once, muted.
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { DEMO_TX_DISCLAIMER, ROUTES } from "@/lib/constants";
import { env } from "@/lib/env";
import { payoutCountdown } from "@/lib/format";
import { useRouter } from "next/navigation";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function BuySuccessStep({
  propertyTitle,
  qty,
  nowMs,
  onClose,
}: {
  propertyTitle: string;
  qty: number;
  /** Optional epoch ms for countdown; omit → generic “Every Friday”. */
  nowMs?: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const [burst, setBurst] = useState(() => !prefersReducedMotion());

  useEffect(() => {
    if (!burst) return;
    const t = setTimeout(() => setBurst(false), 900);
    return () => clearTimeout(t);
  }, [burst]);

  const nextPay = nowMs != null ? payoutCountdown(nowMs) : "Every Friday";

  async function share() {
    const text = `I just bought ${qty} shares of ${propertyTitle} on DigiHouse`;
    const url = env.botUsername
      ? `https://t.me/${env.botUsername}`
      : typeof window !== "undefined"
        ? window.location.origin
        : undefined;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "DigiHouse", text, url });
        return;
      }
    } catch {
      /* user cancelled */
    }
    try {
      await navigator.clipboard?.writeText(url ? `${text}\n${url}` : text);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="relative space-y-4 pb-3 text-center" data-testid="buy-success-step">
      {burst ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 overflow-hidden" aria-hidden>
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="absolute top-0 size-1.5 rounded-full bg-primary opacity-80 animate-pulse"
              style={{ left: `${8 + i * 7}%`, animationDelay: `${i * 40}ms` }}
            />
          ))}
        </div>
      ) : null}
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-success/15">
        <Check size={32} strokeWidth={2.25} className="text-success" aria-hidden />
      </div>
      <div className="space-y-2.5">
        <h2 id="buy-sheet-title" className="text-[1.0625rem] font-semibold leading-snug text-foreground">
          Congratulations!
        </h2>
        <p className="text-sm leading-relaxed text-foreground" data-testid="buy-success-message">
          You now own <span className="font-semibold tnum">{qty}</span>{" "}
          {qty === 1 ? "share" : "shares"} of {propertyTitle}
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Next payout <span className="tnum">{nextPay}</span>
        </p>
        <p className="pt-1 text-[0.6875rem] leading-relaxed text-muted-foreground pb-0.5">
          {DEMO_TX_DISCLAIMER}
        </p>
      </div>
      <div className="flex flex-col gap-2 pt-1">
        <button
          type="button"
          onClick={() => {
            onClose();
            router.push(ROUTES.portfolio);
          }}
          className="inline-flex h-[48px] w-full items-center justify-center rounded-[10px] bg-primary text-[0.9375rem] font-semibold text-primary-foreground active:scale-[0.97] transition-transform duration-[120ms] ease-out"
        >
          View Portfolio
        </button>
        <button
          type="button"
          onClick={() => void share()}
          className="inline-flex h-[48px] w-full items-center justify-center rounded-[10px] bg-surface-2 text-[0.9375rem] font-semibold text-foreground active:scale-[0.97] transition-transform duration-[120ms] ease-out"
        >
          Share
        </button>
      </div>
    </div>
  );
}
