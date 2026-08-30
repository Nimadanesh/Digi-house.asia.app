"use client";
// File responsibility: boolean viewport check — has the referenced element scrolled out
// of view? Used to reveal the sticky CTA once the hero CTA is no longer visible.
import { useEffect, useState } from "react";

export function useScrolledPast(testId: string, enabled = true): boolean {
  const [past, setPast] = useState(false);

  useEffect(() => {
    if (!enabled || typeof IntersectionObserver === "undefined") return;
    let io: IntersectionObserver | null = null;
    let cancelled = false;
    // The observed element may not exist yet on first run (skeleton render while
    // data loads) — retry until it appears, then observe. Without this the IO
    // never attaches (deps never change) and the hook stays false forever.
    const findAndObserve = () => {
      if (cancelled) return;
      const el = document.querySelector(`[data-testid="${testId}"]`);
      if (!el) {
        requestAnimationFrame(findAndObserve);
        return;
      }
      io = new IntersectionObserver(
        ([entry]) => setPast(entry.isIntersecting === false),
        { threshold: 0 },
      );
      io.observe(el);
    };
    findAndObserve();
    return () => {
      cancelled = true;
      io?.disconnect();
    };
  }, [testId, enabled]);

  return past;
}
