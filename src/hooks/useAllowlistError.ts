"use client";
import { useMemo } from "react";

const ALLOWLIST_ERROR_CODES: Record<string, string> = {
  launch_not_allowlisted:
    "Buys and orders are restricted during launch. Your wallet is not yet allowlisted. Contact the team to add it.",
};

export function useAllowlistError(error: Error | null): string | null {
  return useMemo(() => {
    if (!error) return null;
    const err = error as { code?: string };
    const mapped = ALLOWLIST_ERROR_CODES[err.code ?? ""];
    return mapped ?? error.message;
  }, [error]);
}
