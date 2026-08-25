"use client";
// File responsibility: boolean viewport check — has the referenced element scrolled out
// of view? Used to reveal the sticky CTA once the hero CTA is no longer visible.
import { useEffect, useState } from "react";

export function useScrolledPast(testId: string, enabled = true): boolean {
  const [past, setPast] = useState(false);

  useEffect(() => {
    if (!enabled || typeof IntersectionObserver === "undefined") return;
    const el = document.querySelector(`[data-testid="${testId}"]`);
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setPast(entry.isIntersecting === false),
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [testId, enabled]);

  return past;
}
