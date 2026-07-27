"use client";
// File responsibility: swipeable property image gallery + pagination dots (Fable §Gallery).
import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useTelegram } from "@/hooks/useTelegram";

export function PropertyGallery({ images, title }: { images: string[]; title: string }) {
  const slides = images.length > 0 ? images : ["/images/properties/p1.png"];
  const [index, setIndex] = useState(0);
  const startX = useRef<number | null>(null);
  const { haptics } = useTelegram();

  const go = useCallback(
    (next: number) => {
      const n = slides.length;
      setIndex(((next % n) + n) % n);
      haptics.selection();
    },
    [slides.length, haptics],
  );

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
        <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5" aria-label="Gallery pages">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show image ${i + 1}`}
              aria-current={i === index}
              onClick={() => go(i)}
              className={cn(
                "size-2 rounded-full transition-colors duration-200",
                i === index ? "bg-primary" : "bg-white/50",
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
