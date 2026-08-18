"use client";
// File responsibility: App Router segment error UI — Retry without blank Mini App crash.
import { useEffect } from "react";
import { ErrorState } from "@/components/common/ErrorState";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface in devtools only — never claim as UI toast spam.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50svh] max-w-[480px] items-center justify-center px-4">
      <ErrorState
        title="Something went wrong"
        message="Please try again. If it keeps happening, force-close the Mini App and reopen."
        onRetry={reset}
        data-testid="app-error-boundary"
      />
    </div>
  );
}
