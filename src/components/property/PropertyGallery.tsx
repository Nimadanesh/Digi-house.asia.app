"use client";
// File responsibility: swipeable property image gallery + pagination dots (Fable §Gallery).
import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { haptics } from "@/lib/telegram/haptics";

export function PropertyGallery({ images, title }: { images: string[]; title: string }) {
  const t = useTranslations("property");
  const slides = images.length > 0 ? images : ["/images/properties/p1.png"];
  const [index, setIndex] = useState(0);
  const startX = useRef<number | null>(null);

  const go = useCallback((next: number) => {
    const n = slides.length;
    setIndex(((next % n) + n) % n);
    haptics.selection();
  }, [slides.length]);

  return (
    <div
      className="relative -mx-4 aspect-[16/10] overflow-hidden bg-surface-2"
      onTouchStart={(e) => {
        startX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        if (startX.current == null) return;
        const end = e.changedTouches[0]?.clientX ?? startX.current;
        const dx = end - startX.current;
        startX.current = null;
        if (Math.abs(dx) < 40) return;
        go(dx < 0 ? index + 1 : index - 1);
      }}
      data-testid="property-gallery"
    >
      <div
        className="flex h-full w-full transition-transform duration-[280ms] ease-[var(--ease-tg-out)]"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((src, i) => (
          <div key={`${src}-${i}`} className="relative h-full w-full shrink-0">
            <Image
              src={src}
              alt={`${title} photo ${i + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 480px) 100vw, 480px"
              priority={i === 0}
            />
          </div>
        ))}
      </div>
      {slides.length > 1 ? (
        <>
          <button
            type="button"
            aria-label={t("showImage", { n: index === 0 ? slides.length : index })}
            onClick={() => go(index - 1)}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className="absolute start-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white transition-transform duration-[120ms] ease-out active:scale-[0.97]"
          >
            <ChevronLeft size={22} strokeWidth={1.75} className="rtl:rotate-180" aria-hidden />
          </button>
          <button
            type="button"
            aria-label={t("showImage", { n: index === slides.length - 1 ? 1 : index + 2 })}
            onClick={() => go(index + 1)}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className="absolute end-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white transition-transform duration-[120ms] ease-out active:scale-[0.97]"
          >
            <ChevronRight size={22} strokeWidth={1.75} className="rtl:rotate-180" aria-hidden />
          </button>
          <div
            className="absolute bottom-3 inset-x-0 flex justify-center"
            aria-label={t("galleryPages")}
          >
            <span className="rounded-full bg-black/55 px-2.5 py-1 text-[0.6875rem] font-semibold tabular-nums text-white">
              {index + 1}
              <span className="opacity-70">/{slides.length}</span>
            </span>
          </div>
        </>
      ) : null}
    </div>
  );
}
