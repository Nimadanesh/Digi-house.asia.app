// File responsibility: the uppercase muted section-label primitive.
// DESIGN_SYSTEM typography: section label 0.6875rem / 600, uppercase, +0.04em tracking, --muted-foreground.
import type { ReactNode } from "react";

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={className ? `${className} text-[0.6875rem] font-semibold uppercase tracking-[0.04em] text-muted-foreground` : "text-[0.6875rem] font-semibold uppercase tracking-[0.04em] text-muted-foreground"}>
      {children}
    </p>
  );
}