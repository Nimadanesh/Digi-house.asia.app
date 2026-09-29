"use client";
// File responsibility: Club header tier podium — decorative three-card visual
// (Elite / Signature / Private+) with headline + tagline and a scroll-linked
// collapse of the side cards toward the hero. Presentation only: no data, no
// navigation, no membership logic (the membership card below stays the source
// of truth for the member's actual tier).
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Crown } from "lucide-react";
import styles from "./club-podium.module.css";

/** Scroll window over which the side cards collapse (px). */
const COLLAPSE_WINDOW_PX = 300;

/**
 * Pure material hook: writes scroll progress (0..1) as --podium-p on the
 * stage element; CSS custom-property math does the interpolation (each card
 * carries its own --podium-open-x default, so JS never sets it). rAF +
 * passive listener; no React re-render per frame. Returns the stage ref.
 */
function usePodiumScrollCollapse(): React.RefObject<HTMLDivElement | null> {
  const stageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return; // Reduced motion: static final composition.

    let raf = 0;
    let lastP = -1;
    const update = () => {
      raf = 0;
      const rect = stage.getBoundingClientRect();
      // Progress 0 while the stage is fully in view; 1 after it has scrolled
      // COLLAPSE_WINDOW_PX past the viewport top.
      const p = Math.min(1, Math.max(0, -rect.top / COLLAPSE_WINDOW_PX));
      if (p === lastP) return;
      lastP = p;
      stage.style.setProperty("--podium-p", p.toFixed(4));
    };
    const onScroll = () => {
      if (raf === 0) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf !== 0) cancelAnimationFrame(raf);
      stage.style.removeProperty("--podium-p");
    };
  }, []);

  return stageRef;
}

export function ClubTierPodium() {
  const t = useTranslations("club");
  const stageRef = usePodiumScrollCollapse();

  return (
    <section aria-label={t("podium.label")} data-testid="club-podium">
      <h2 className={styles.headline} data-testid="podium-headline">{t("podium.headline")}</h2>

      <div className={styles.stage} ref={stageRef}>
        {/* Elite — left / behind */}
        <div
          className={`${styles.card} ${styles.elite}`}
          data-side="left"
          data-testid="podium-card-elite"
          aria-hidden="true"
        >
          <div className={`${styles.shell} ${styles.eliteShell}`} />
          <span className={styles.eliteEdge} aria-hidden />
          <span className={styles.eliteSheen} aria-hidden />
          <div className={styles.content}>
            <span className={`${styles.number} ${styles.eliteNumber}`}>2</span>
            <span className={`${styles.label} ${styles.eliteLabel}`}>Elite</span>
          </div>
        </div>

        {/* Private+ — right / behind */}
        <div
          className={`${styles.card} ${styles.private}`}
          data-side="right"
          data-testid="podium-card-private-plus"
          aria-hidden="true"
        >
          <div className={`${styles.shell} ${styles.privateShell}`} />
          <span className={styles.privateEdge} aria-hidden />
          <span className={styles.privateSheen} aria-hidden />
          <div className={styles.content}>
            <span className={`${styles.number} ${styles.privateNumber}`}>3</span>
            <span className={`${styles.label} ${styles.privateLabel}`}>Private+</span>
          </div>
        </div>

        {/* Signature — center / dominant */}
        <div
          className={`${styles.card} ${styles.signature}`}
          data-testid="podium-card-signature"
        >
          <div className={`${styles.shell} ${styles.signatureShell}`} />
          <span className={styles.signatureSheen} aria-hidden />
          <div className={styles.content}>
            <Crown
              size={15}
              strokeWidth={1.75}
              aria-hidden
              className={styles.crown}
            />
            <span className={`${styles.number} ${styles.signatureNumber}`}>1</span>
            <span className={`${styles.label} ${styles.signatureLabel}`}>Signature</span>
            <span className={styles.signatureThreshold}>$500,000+</span>
          </div>
        </div>
      </div>

      <p className={styles.tagline} data-testid="podium-tagline">{t("podium.tagline")}</p>
    </section>
  );
}
