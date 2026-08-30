"use client";
// File responsibility: direction-aware scroll tracking — reports whether the user
// is scrolling UP and has moved beyond `threshold` px from the top. Used to reveal
// the compact property top bar (back + title) without forcing a full scroll to top.
// The absolute-position gate (scrollY > threshold) prevents the bar from flickering
// on at page top; the direction gate is what makes it appear on scroll-up.
import { useEffect, useState } from "react";

export function useScrollDirection(threshold = 80): boolean {
  const [scrolledUp, setScrolledUp] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let lastY = window.scrollY;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY;
        // Ignore sub-pixel jitter (iOS rubber-banding, momentum noise).
        if (Math.abs(y - lastY) < 4) return;
        const up = y < lastY;
        lastY = y;
        setScrolledUp(up && y > threshold);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [threshold]);

  return scrolledUp;
}
