// File responsibility: title + muted description stack with global vertical rhythm.
// Use for settings rows, empty CTAs, and any primary label + gray helper pair.
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Gap title → hint: 6px. Hint uses relaxed leading for multi-line copy. */
export function LabelStack({
  title,
  hint,
  className,
  titleClassName,
  hintClassName,
}: {
  title: ReactNode;
  hint?: ReactNode;
  className?: string;
  titleClassName?: string;
  hintClassName?: string;
}) {
  return (
    <div className={cn("min-w-0 flex-1 space-y-1.5 pe-3", className)}>
      <div className={cn("text-sm font-medium leading-snug text-foreground", titleClassName)}>
        {title}
      </div>
      {hint != null && hint !== "" ? (
        <div
          className={cn(
            "text-xs leading-relaxed text-muted-foreground pb-0.5",
            hintClassName,
          )}
        >
          {hint}
        </div>
      ) : null}
    </div>
  );
}
