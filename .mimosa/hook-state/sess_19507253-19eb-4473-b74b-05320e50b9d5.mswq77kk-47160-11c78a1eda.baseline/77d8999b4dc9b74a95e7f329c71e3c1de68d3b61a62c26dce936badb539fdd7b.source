// File responsibility: muted secondary/description text with consistent top/bottom breathing room.
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type MutedVariant = "body" | "meta" | "caption";

const VARIANT: Record<MutedVariant, string> = {
  /** Body helper under a heading (empty states, about blurbs). */
  body: "mt-1.5 mb-0.5 text-sm leading-relaxed text-muted-foreground",
  /** Micro label above a value (stats grids). */
  meta: "mb-1 text-[0.6875rem] leading-snug text-muted-foreground",
  /** Tiny footers / disclaimers. */
  caption: "mt-1.5 text-[0.6875rem] leading-relaxed text-muted-foreground",
};

export function MutedText({
  children,
  variant = "body",
  className,
  as: Tag = "p",
  ...rest
}: {
  children: ReactNode;
  variant?: MutedVariant;
  className?: string;
  as?: "p" | "span" | "div";
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag className={cn(VARIANT[variant], className)} {...rest}>
      {children}
    </Tag>
  );
}
