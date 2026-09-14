"use client";
// File responsibility: fullscreen image lightbox for the specialist portrait
// (revision contract 2026-09-13) — dark backdrop, large centered image, close
// via ✕ / backdrop click / Escape. Local images only (public assets).
import { useEffect } from "react";
import { X } from "lucide-react";
import { haptics } from "@/lib/telegram/haptics";

export function ImageLightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4"
      data-testid="image-lightbox"
      onClick={onClose}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={() => {
          haptics.selection();
          onClose();
        }}
        className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-transform duration-[120ms] ease-out active:scale-[0.96]"
        data-testid="image-lightbox-close"
      >
        <X size={20} strokeWidth={2} aria-hidden />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="max-h-full max-w-full rounded-[12px] object-contain"
        data-testid="image-lightbox-img"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
