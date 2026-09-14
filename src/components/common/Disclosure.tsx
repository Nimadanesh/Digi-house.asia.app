"use client";
// File responsibility: THE shared block-embedded disclosure primitive — a header
// button (title slot + trailing slot + rotating chevron) revealing collapsible
// content inside a Block. Replaces the hand-rolled header expanders that had
// multiplied across Estate Detail (cost breakdown, resale price history).
// Row-embedded expanders (earnings rows, allocation bar) and dropdowns keep
// their own shapes — this primitive owns only the Block-header variant.
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Block } from "./Block";

export function Disclosure({
  title,
  trailing,
  open,
  onOpenChange,
  toggleTestId,
  contentTestId,
  contentClassName = "border-t border-border p-4",
  children,
}: {
  /** Left header content (caller styles the label). */
  title: React.ReactNode;
  /** Right-side content rendered before the chevron (value, tag, price…). */
  trailing?: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toggleTestId?: string;
  contentTestId?: string;
  contentClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <Block className="overflow-hidden">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
        data-testid={toggleTestId}
      >
        <span className="min-w-0 flex-1">{title}</span>
        <span className="flex shrink-0 items-center gap-1.5">
          {trailing}
          <ChevronDown
            size={16}
            strokeWidth={1.75}
            aria-hidden
            className={cn(
              "text-muted-foreground transition-transform duration-200 ease-out",
              open ? "rotate-180" : "",
            )}
          />
        </span>
      </button>
      {open ? (
        <div className={contentClassName} data-testid={contentTestId}>
          {children}
        </div>
      ) : null}
    </Block>
  );
}
