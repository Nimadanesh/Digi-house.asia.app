"use client";
// File responsibility: Fifi's visual identity mark — one avatar reused by the
// global entry point, the ChatSheet header, and message rows. Azure gradient on
// the product's primary; no custom fonts, no external assets. Presence moments
// (FAB, sheet header, empty state) add `glow` (slow breathing underlay) and
// `sheen` (the home-balance light pass: two quick sweeps, then a hold) —
// message rows stay still.
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "size-6 rounded-full",
  md: "size-9 rounded-full",
  lg: "size-12 rounded-full",
} as const;

const ICON_SIZES = {
  sm: "size-3.5",
  md: "size-4.5",
  lg: "size-6",
} as const;

export function FifiAvatar({
  size = "md",
  glow = false,
  sheen = false,
  className,
}: {
  size?: keyof typeof SIZES;
  glow?: boolean;
  sheen?: boolean;
  className?: string;
}) {
  return (
    <span aria-hidden className={cn("relative inline-flex shrink-0 items-center justify-center", className)}>
      {glow ? (
        <span className="fifi-breathe absolute inset-0 rounded-full bg-primary/60 blur-[10px]" />
      ) : null}
      <span
        className={cn(
          "relative inline-flex items-center justify-center overflow-hidden",
          "bg-gradient-to-br from-primary to-[#0f5f8f]",
          "ring-1 ring-white/20",
          SIZES[size],
        )}
      >
        <Sparkles className={cn("relative text-white", ICON_SIZES[size])} strokeWidth={2.2} />
        {sheen ? (
          <span className="fifi-sheen-band absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        ) : null}
      </span>
    </span>
  );
}
