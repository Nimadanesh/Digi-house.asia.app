"use client";
// File responsibility: the persistent Club particle background — the same
// visual language as the entrance, continued as a subtle background layer
// behind every Club component. Background only: aria-hidden, pointer-events
// none, no layout impact, no interaction, one canvas + rAF.
import { useEffect, useRef, useState } from "react";
import { createClubAmbientCanvas } from "@/lib/club/entrance";
import styles from "./club-ambient.module.css";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function ClubAmbientBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [reduced] = useState(prefersReducedMotion);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handle = createClubAmbientCanvas(canvas, { reducedMotion: reduced });
    return () => handle.destroy();
  }, [reduced]);

  return (
    <div className={styles.ambient} data-testid="club-ambient" aria-hidden="true">
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
