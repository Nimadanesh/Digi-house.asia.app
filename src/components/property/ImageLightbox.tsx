"use client";
// File responsibility: fullscreen image lightbox (1..N images) — dark
// backdrop, swipeable slide track (same pattern/easing as PropertyGallery),
// arrow + keyboard nav with wrap, "n/N" counter, close via ✕ / backdrop /
// Escape. Light focus handling (autofocus close, Tab kept inside) + body
// scroll lock while open. Local images only (public assets).
//
// Two call shapes, one viewer: single-image ({ src, alt }, e.g. specialist
// portrait) or gallery ({ images, imageAlts, initialIndex }).
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { haptics } from "@/lib/telegram/haptics";

const SWIPE_MIN_PX = 40;

export function ImageLightbox({
  src,
  alt,
  images,
  imageAlts,
  initialIndex = 0,
  onClose,
}: {
  /** Single-image mode (legacy portrait); ignored when `images` is non-empty. */
  src?: string;
  /** Dialog label; single-image alt; gallery alt prefix fallback. */
  alt?: string;
  /** Gallery mode (villa photos). */
  images?: string[];
  /** Per-image alts for gallery mode. */
  imageAlts?: string[];
  /** Slide to open on (gallery mode). */
  initialIndex?: number;
  onClose: () => void;
}) {
  const t = useTranslations("property");
  const list = images && images.length > 0 ? images : src != null ? [src] : [];
  const [index, setIndex] = useState(() =>
    list.length > 0 ? Math.min(Math.max(0, initialIndex), list.length - 1) : 0,
  );
  const startX = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const go = useCallback(
    (next: number) => {
      const n = list.length;
      if (n === 0) return;
      setIndex(((next % n) + n) % n);
      haptics.selection();
    },
    [list.length],
  );

  // Escape / arrows + minimal Tab trap + autofocus close + scroll lock.
  useEffect(() => {
    closeRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "ArrowRight") {
        setIndex((i) => (list.length > 0 ? (i + 1) % list.length : i));
        haptics.selection();
        return;
      }
      if (e.key === "ArrowLeft") {
        setIndex((i) => (list.length > 0 ? (i - 1 + list.length) % list.length : i));
        haptics.selection();
        return;
      }
      if (e.key === "Tab") {
        const root = rootRef.current;
        if (root == null) return;
        const focusables = Array.from(
          root.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((el) => el.offsetParent !== null || el === document.activeElement);
        if (focusables.length === 0) return;
        const first = focusables[0]!;
        const last = focusables[focusables.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, list.length]);

  if (list.length === 0) return null;
  const multi = list.length > 1;

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={alt ?? t("gallery")}
      className="fixed inset-0 z-[80] flex flex-col bg-black/90"
      data-testid="image-lightbox"
      onClick={onClose}
    >
      <div className="flex items-center justify-end p-4 pb-0">
        <button
          ref={closeRef}
          type="button"
          aria-label="Close"
          onClick={() => {
            haptics.selection();
            onClose();
          }}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-transform duration-[120ms] ease-out active:scale-[0.96]"
          data-testid="image-lightbox-close"
        >
          <X size={20} strokeWidth={2} aria-hidden />
        </button>
      </div>
      <div
        className="relative min-h-0 flex-1 overflow-hidden"
        data-testid="image-lightbox-viewport"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          startX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          if (startX.current == null) return;
          const end = e.changedTouches[0]?.clientX ?? startX.current;
          const dx = end - startX.current;
          startX.current = null;
          if (Math.abs(dx) < SWIPE_MIN_PX) return;
          go(dx < 0 ? index + 1 : index - 1);
        }}
      >
        <div
          className="flex h-full w-full transition-transform duration-[280ms] ease-[var(--ease-tg-out)]"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {list.map((s, i) => (
            <div key={`${s}-${i}`} className="relative h-full w-full shrink-0">
              <Image
                src={s}
                alt={imageAlts?.[i] ?? (alt != null ? `${alt} ${i + 1}` : "")}
                fill
                className="object-contain"
                sizes="100vw"
                priority={i === index}
              />
            </div>
          ))}
        </div>
        {multi ? (
          <>
            <button
              type="button"
              aria-label={t("showImage", { n: index === 0 ? list.length : index })}
              onClick={(e) => {
                e.stopPropagation();
                go(index - 1);
              }}
              className="absolute start-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white ring-1 ring-white/20 backdrop-blur-sm transition-transform duration-150 ease-out active:scale-[0.97]"
              data-testid="image-lightbox-prev"
            >
              <ChevronLeft size={22} strokeWidth={1.75} className="rtl:rotate-180" aria-hidden />
            </button>
            <button
              type="button"
              aria-label={t("showImage", { n: index === list.length - 1 ? 1 : index + 2 })}
              onClick={(e) => {
                e.stopPropagation();
                go(index + 1);
              }}
              className="absolute end-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white ring-1 ring-white/20 backdrop-blur-sm transition-transform duration-150 ease-out active:scale-[0.97]"
              data-testid="image-lightbox-next"
            >
              <ChevronRight size={22} strokeWidth={1.75} className="rtl:rotate-180" aria-hidden />
            </button>
            <div className="absolute bottom-4 inset-x-0 flex justify-center">
              <span
                className="rounded-full bg-black/55 px-2.5 py-1 text-[0.6875rem] font-semibold tabular-nums text-white ring-1 ring-white/20 backdrop-blur-sm"
                data-testid="image-lightbox-counter"
              >
                {index + 1}/{list.length}
              </span>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
