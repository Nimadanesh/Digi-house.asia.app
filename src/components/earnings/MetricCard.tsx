"use client";
// File responsibility: small prominent metric tile for the Earnings quick-status grid.
import type { ReactNode } from "react";
import { Block } from "@/components/common/Block";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  caption,
  valueClassName,
  testId,
}: {
  label: string;
  value: ReactNode;
  caption?: string;
  valueClassName?: string;
  testId?: string;
}) {
  return (
    <Block className="min-w-0 flex-1 p-4" data-testid={testId}>
      <p className="truncate text-[0.6875rem] leading-snug text-muted-foreground">{label}</p>
      <p className={cn("mt-1.5 truncate text-[1.0625rem] font-bold leading-none tnum text-foreground", valueClassName)}>
        {value}
      </p>
      {caption ? (
        <p className="mt-1.5 truncate text-[0.6875rem] leading-snug text-muted-foreground">{caption}</p>
      ) : null}
    </Block>
  );
}
