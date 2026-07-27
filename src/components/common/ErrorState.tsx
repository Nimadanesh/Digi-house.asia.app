"use client";
// File responsibility: friendly error UI with Retry CTA (DESIGN_SYSTEM empty/error pattern).
import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function ErrorState({
  title,
  message,
  onRetry,
  className,
  "data-testid": testId = "error-state",
}: {
  title?: string;
  message: string;
  onRetry: () => void;
  className?: string;
  "data-testid"?: string;
}) {
  const t = useTranslations("common");
  const resolvedTitle = title ?? t("somethingWentWrong");

  return (
    <div
      className={cn("flex flex-col items-center justify-center px-6 py-16 text-center", className)}
      data-testid={testId}
      role="alert"
    >
      <AlertCircle size={64} strokeWidth={1.5} className="text-muted-foreground" aria-hidden />
      <h2 className="mt-4 text-[0.9375rem] font-semibold text-foreground">{resolvedTitle}</h2>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">{message}</p>
      <div className="mt-4">
        <Button
          type="button"
          onClick={onRetry}
          className="min-h-[44px] rounded-[10px] px-5 text-sm font-semibold"
        >
          {t("tryAgain")}
        </Button>
      </div>
    </div>
  );
}
