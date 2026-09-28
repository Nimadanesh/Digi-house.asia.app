"use client";
// File responsibility: ONE wallet icon tile — brand image on a white circle,
// graceful monogram fallback when the URL is missing or fails to load.
// White tile keeps dark and light brand marks equally legible at small sizes.
import { useState } from "react";
import { walletIconUrl } from "@/components/wallet/wallet-icons";
import { cn } from "@/lib/utils";

function initials(name: string): string {
  const parts = name.replace(/[^A-Za-z0-9 ]/g, "").split(" ").filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function WalletIcon({
  walletId,
  name,
  size = "md",
  testId,
}: {
  walletId: string;
  name: string;
  size?: "md" | "sm";
  testId?: string;
}) {
  const [failed, setFailed] = useState(false);
  const url = failed ? null : walletIconUrl(walletId);
  const tile = size === "md" ? "size-10 text-[0.8125rem]" : "size-9 text-xs";
  const iconTestId = testId ?? `wallet-icon-${walletId}`;

  if (!url) {
    return (
      <span
        aria-hidden
        data-testid={`wallet-monogram-${walletId}`}
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-surface-2 font-bold text-foreground",
          tile,
        )}
      >
        {initials(name)}
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white",
        tile,
      )}
    >
      {/* Plain img (not next/image): remote registry hosts need no loader config. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        loading="lazy"
        draggable={false}
        onError={() => setFailed(true)}
        className="size-full object-contain p-[7px]"
        data-testid={iconTestId}
      />
    </span>
  );
}
