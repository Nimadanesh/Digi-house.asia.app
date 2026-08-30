"use client";
// File responsibility: Telegram-style bottom sheet — portals to body; CSS transition (no framer on hot path).
// Also owns the sheet close-registry: pages consult closeTopSheet() so the Telegram
// BackButton closes the topmost open sheet instead of navigating away mid-flow.
import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

/** Stack of open sheets' close callbacks (topmost = last). */
const sheetStack: Array<() => void> = [];

/** Close the topmost open sheet; true when one was closed. */
export function closeTopSheet(): boolean {
  const top = sheetStack[sheetStack.length - 1];
  if (!top) return false;
  top();
  return true;
}

function subscribe() {
  return () => {};
}
function clientOk() {
  return true;
}
function serverNo() {
  return false;
}

export function Sheet({
  open,
  onClose,
  children,
  className,
  bodyClassName,
  labelledBy,
  dismissible = true,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  /** Override the default scroll body (e.g. language picker owns its own single scroller). */
  bodyClassName?: string;
  labelledBy?: string;
  /** False while a decision is in flight (pending/success) — backdrop + Esc won't close. */
  dismissible?: boolean;
}) {
  const mounted = useSyncExternalStore(subscribe, clientOk, serverNo);

  useEffect(() => {
    if (!open) return;
    const closer = () => onClose();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissible) onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (dismissible) sheetStack.push(closer);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      const i = sheetStack.lastIndexOf(closer);
      if (i >= 0) sheetStack.splice(i, 1);
    };
  }, [open, dismissible, onClose]);

  if (!mounted || typeof document === "undefined" || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-end justify-center"
      role="presentation"
      data-testid="sheet-root"
    >
      <button
        type="button"
        aria-label="Close sheet"
        className="absolute inset-0 bg-black/45 animate-in fade-in duration-200"
        style={{ animation: "dh-fade-in 160ms ease-out" }}
        onClick={dismissible ? onClose : undefined}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        data-testid="sheet-panel"
        className={cn(
          "relative z-10 w-full max-w-[480px] bg-card rounded-t-[16px] pt-2",
          "pb-[max(env(safe-area-inset-bottom),12px)]",
          "shadow-[0_-8px_32px_rgba(0,0,0,0.35)]",
          className,
        )}
        style={{ animation: "dh-sheet-up 280ms cubic-bezier(0.23, 1, 0.32, 1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-1 h-[5px] w-[36px] shrink-0 rounded-full bg-border" aria-hidden />
        <div
          className={cn(
            "max-h-[min(85svh,680px)] overflow-y-auto overscroll-contain px-4 pt-3",
            bodyClassName,
          )}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
