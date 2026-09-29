"use client";
// File responsibility: the Club entrance experience — a short, cinematic,
// decorative overlay that plays when the user enters Club from Home. Fully
// isolated: it reads the one-shot signal, owns a single canvas + its timeline,
// and renders nothing otherwise. It never changes Club content, routing, data,
// or logic. Decorative only (aria-hidden, pointer-events none) so the existing
// Club page stays visible and reachable underneath.
//
// Arming is SIGNAL-DRIVEN, not route-driven: the overlay activates the moment
// the Home → Club action requests it — before the /club route paints — so the
// first visible state after the tap is the entrance, never a Club-page flash.
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  CLUB_ENTRANCE_REDUCED_END,
  CLUB_ENTRANCE_TIMELINE,
  consumeClubEntrance,
  createClubEntranceCanvas,
  hasPendingClubEntrance,
  subscribeClubEntrance,
} from "@/lib/club/entrance";
import styles from "./club-entrance.module.css";

/** Brand mark stays Latin in every locale (PROGRAM A1). */
const BRAND = "FractionalLuxe";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function ClubEntranceExperience() {
  const t = useTranslations("club");
  const [playing, setPlaying] = useState(false);
  const [closing, setClosing] = useState(false);
  const [reduced] = useState(prefersReducedMotion);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Arm from the external signal (setState in a subscription callback is a
  // legitimate external-system update). Consuming the request guarantees it
  // never replays on re-render, resize, or internal Club navigation.
  const arm = useCallback(() => {
    if (!hasPendingClubEntrance()) return;
    consumeClubEntrance();
    setClosing(false);
    setPlaying(true);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeClubEntrance(arm);
    // Covers a request that arrived before this component subscribed.
    queueMicrotask(arm);
    return unsubscribe;
  }, [arm]);

  // Timeline + failsafe: the overlay always unmounts, so the Club page can
  // never be trapped behind it.
  useEffect(() => {
    if (!playing) return;
    const end = reduced ? CLUB_ENTRANCE_REDUCED_END : CLUB_ENTRANCE_TIMELINE.end;
    const fadeAt = reduced ? 750 : CLUB_ENTRANCE_TIMELINE.convergeEnd;
    const fadeTimer = setTimeout(() => setClosing(true), fadeAt);
    const endTimer = setTimeout(() => {
      setClosing(false);
      setPlaying(false);
    }, end);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(endTimer);
    };
  }, [playing, reduced]);

  // Single-canvas particle engine (rAF, DPR-capped, paused while hidden).
  useEffect(() => {
    if (!playing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handle = createClubEntranceCanvas(canvas, { reducedMotion: reduced });
    return () => handle.destroy();
  }, [playing, reduced]);

  if (!playing) return null;

  return (
    <div
      className={cn(styles.overlay, closing && styles.closing)}
      data-testid="club-entrance"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className={styles.canvas} />
      <div className={styles.copy}>
        <p className={styles.brand}>{BRAND}</p>
        <h2 className={styles.title}>{t("eyebrow")}</h2>
      </div>
    </div>
  );
}
