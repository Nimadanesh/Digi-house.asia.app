// File responsibility: the Club particle atmosphere's non-React core — the
// one-shot entry signal, the shared timeline, and ONE single-canvas particle
// engine used by both the entrance overlay and the persistent Club
// background (ambient profile). Self-contained and additive: no store, no
// routing, no Club logic, no global styles, no dependencies.

/**
 * The entrance timeline (ms) — the refined ~10s experience. The overlay never
 * lives past `end` (failsafe).
 * ambientIn:     the dark Club atmosphere appears; particles fade in.
 * convergeStart: the field begins converging toward the center.
 * convergeEnd:   convergence ends; the entrance begins to dissolve.
 * end:           total lifetime — the overlay always unmounts here.
 */
export const CLUB_ENTRANCE_TIMELINE = {
  ambientIn: 1200,
  convergeStart: 7000,
  convergeEnd: 8800,
  end: 10000,
} as const;

/** Reduced-motion lifetime: a short, still reveal (still reveals Club normally). */
export const CLUB_ENTRANCE_REDUCED_END = 1400;

// ── one-shot entry signal ───────────────────────────────────────────────────
// Set once when the user taps Club on Home; consumed once when the entrance
// arms on /club. Never replays on re-render, resize, or internal navigation.

let pending = false;
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

/** Request the entrance — called from the Home → Club action. */
export function requestClubEntrance(): void {
  pending = true;
  notify();
}

/** Whether an entrance request is waiting to be consumed. */
export function hasPendingClubEntrance(): boolean {
  return pending;
}

/** Consume the pending request (called by the entrance exactly once). */
export function consumeClubEntrance(): void {
  pending = false;
  notify();
}

/** Subscribe to request/consume changes (backs `useSyncExternalStore`). */
export function subscribeClubEntrance(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// ── single-canvas particle engine ───────────────────────────────────────────

const CHAMPAGNE_FILL = "rgb(255, 244, 224)";
const MUTED_BLUE_FILL = "rgb(150, 180, 255)";
const MAX_PARTICLES = 90;
const MOBILE_COUNT = 48;
const DESKTOP_COUNT = 80;
const MOBILE_BREAKPOINT = 768;
/** How far the majority of particles are pulled toward the center (0–1). */
const CONVERGE_PULL = 0.72;
/** Ambient background always fades in gently, then holds. */
const AMBIENT_FADE_IN = 1200;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
  phase: number;
  freq: number;
  amp: number;
  /** Per-particle convergence share so the gather stays organic. */
  pull: number;
  blue: boolean;
  bright: boolean;
}

interface ParticleProfile {
  /** Global opacity multiplier — the ambient field is much more subtle. */
  alphaScale: number;
  /** Movement-speed multiplier — the ambient field is calmer. */
  speedScale: number;
  /** Whether particles converge toward the center. */
  convergence: boolean;
  /** Whether the timeline envelope drives opacity (entrance) or a slow fade-in. */
  timed: boolean;
  /** Glow halo multiplier. */
  glowScale: number;
}

const ENTRANCE_PROFILE: ParticleProfile = {
  alphaScale: 1,
  speedScale: 1,
  convergence: true,
  timed: true,
  glowScale: 1,
};

const AMBIENT_PROFILE: ParticleProfile = {
  alphaScale: 0.5,
  speedScale: 0.6,
  convergence: false,
  timed: false,
  glowScale: 0.5,
};

export interface ClubParticleCanvasHandle {
  destroy(): void;
}

/** @deprecated use ClubParticleCanvasHandle. */
export type ClubEntranceCanvasHandle = ClubParticleCanvasHandle;

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge1 <= edge0) return x >= edge1 ? 1 : 0;
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * Start a particle field on ONE canvas. RequestAnimationFrame only, no React
 * state, no per-frame allocations, DPR capped at 1.5, paused while the document
 * is hidden. Returns a `destroy()` that cancels the loop and removes listeners.
 * No-op when a 2D context is unavailable (SSR / jsdom).
 */
function createParticleCanvas(
  canvas: HTMLCanvasElement,
  profile: ParticleProfile,
  reducedMotion: boolean,
): ClubParticleCanvasHandle {
  let context: CanvasRenderingContext2D | null = null;
  try {
    context = canvas.getContext("2d", { alpha: true });
  } catch {
    context = null;
  }
  if (!context) return { destroy() {} };
  const ctx = context;

  // Preallocated once; reused for the whole life of the loop (no per-frame objects).
  const particles: Particle[] = [];
  for (let i = 0; i < MAX_PARTICLES; i++) {
    particles.push({ x: 0, y: 0, vx: 0, vy: 0, r: 1, alpha: 0.3, phase: 0, freq: 0.2, amp: 2, pull: 1, blue: false, bright: false });
  }

  let width = 0;
  let height = 0;
  let dpr = 1;
  let raf = 0;
  let start = 0;
  let last = 0;
  let paused = false;
  let disposed = false;

  function activeCount(): number {
    const target = width < MOBILE_BREAKPOINT ? MOBILE_COUNT : DESKTOP_COUNT;
    return Math.min(target, MAX_PARTICLES);
  }

  function resetParticle(p: Particle): void {
    p.x = Math.random() * width;
    p.y = Math.random() * height;
    // ~1.3× the previous drift speed — clearly alive, still slow.
    p.vx = (Math.random() - 0.5) * 5.2;
    p.vy = -(2 + Math.random() * 4.5);
    p.r = 0.6 + Math.random() * 1.1;
    p.alpha = 0.16 + Math.random() * 0.5;
    p.phase = Math.random() * Math.PI * 2;
    p.freq = 0.2 + Math.random() * 0.3;
    p.amp = 2 + Math.random() * 3.2;
    p.pull = 0.85 + Math.random() * 0.3;
    p.blue = Math.random() < 0.15;
    p.bright = Math.random() < 0.14;
  }

  function resize(): void {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    if (w === width && h === height) return; // only on actual change
    const prevW = width;
    const prevH = height;
    width = w;
    height = h;
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (prevW === 0 || prevH === 0) {
      for (let i = 0; i < MAX_PARTICLES; i++) resetParticle(particles[i]);
    } else {
      const sx = w / prevW;
      const sy = h / prevH;
      for (let i = 0; i < MAX_PARTICLES; i++) {
        particles[i].x *= sx;
        particles[i].y *= sy;
      }
    }
  }

  function drawParticle(p: Particle, globalAlpha: number, convergeK: number, time: number): void {
    const a = p.alpha * globalAlpha;
    if (a <= 0.003) return;
    const cx = width * 0.5;
    const cy = height * 0.46;
    const wobbleX = Math.sin(time * p.freq + p.phase) * p.amp;
    const wobbleY = Math.cos(time * p.freq * 0.8 + p.phase) * p.amp * 0.7;
    const x = p.x + wobbleX + (cx - (p.x + wobbleX)) * convergeK;
    const y = p.y + wobbleY + (cy - (p.y + wobbleY)) * convergeK;
    if (p.bright) {
      ctx.globalAlpha = a * 0.1 * profile.glowScale;
      ctx.fillStyle = p.blue ? MUTED_BLUE_FILL : CHAMPAGNE_FILL;
      ctx.beginPath();
      ctx.arc(x, y, p.r * 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = a;
    ctx.fillStyle = p.blue ? MUTED_BLUE_FILL : CHAMPAGNE_FILL;
    ctx.beginPath();
    ctx.arc(x, y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }

  function render(elapsed: number, dt: number): void {
    const time = elapsed / 1000;
    let globalAlpha: number;
    let convergeK = 0;
    if (profile.timed) {
      const inK = smoothstep(0, CLUB_ENTRANCE_TIMELINE.ambientIn, elapsed);
      const outK = 1 - smoothstep(CLUB_ENTRANCE_TIMELINE.convergeEnd, CLUB_ENTRANCE_TIMELINE.end, elapsed);
      globalAlpha = inK * outK * profile.alphaScale;
      if (profile.convergence) {
        convergeK = smoothstep(CLUB_ENTRANCE_TIMELINE.convergeStart, CLUB_ENTRANCE_TIMELINE.convergeEnd, elapsed) * CONVERGE_PULL;
      }
    } else {
      globalAlpha = smoothstep(0, AMBIENT_FADE_IN, elapsed) * profile.alphaScale;
    }
    ctx.clearRect(0, 0, width, height);
    const count = activeCount();
    for (let i = 0; i < count; i++) {
      const p = particles[i];
      p.x += p.vx * dt * profile.speedScale;
      p.y += p.vy * dt * profile.speedScale;
      if (p.y < -10) p.y = height + 10;
      else if (p.y > height + 10) p.y = -10;
      if (p.x < -10) p.x = width + 10;
      else if (p.x > width + 10) p.x = -10;
      drawParticle(p, globalAlpha, convergeK * p.pull, time);
    }
    ctx.globalAlpha = 1;
  }

  function tick(now: number): void {
    raf = 0;
    if (disposed) return;
    if (!start) {
      start = now;
      last = now;
    }
    const elapsed = now - start;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    render(elapsed, dt);
    if (profile.timed && elapsed >= CLUB_ENTRANCE_TIMELINE.end) return; // auto-stop
    if (!paused) raf = requestAnimationFrame(tick);
  }

  function onResize(): void {
    resize();
  }

  function onVisibility(): void {
    if (document.hidden) {
      paused = true;
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    } else if (paused && !disposed) {
      paused = false;
      last = performance.now();
      if (!raf) raf = requestAnimationFrame(tick);
    }
  }

  resize();
  if (reducedMotion) {
    // Static atmosphere: one frame, no continuous animation.
    render(profile.timed ? CLUB_ENTRANCE_TIMELINE.ambientIn : AMBIENT_FADE_IN, 0);
  } else {
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    raf = requestAnimationFrame(tick);
  }

  return {
    destroy() {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    },
  };
}

/** The timed Club entrance field (converges, then dissolves at `end`). */
export function createClubEntranceCanvas(
  canvas: HTMLCanvasElement,
  options: { reducedMotion?: boolean } = {},
): ClubParticleCanvasHandle {
  return createParticleCanvas(canvas, ENTRANCE_PROFILE, options.reducedMotion === true);
}

/** The persistent, calmer Club background field (never converges, never stops). */
export function createClubAmbientCanvas(
  canvas: HTMLCanvasElement,
  options: { reducedMotion?: boolean } = {},
): ClubParticleCanvasHandle {
  return createParticleCanvas(canvas, AMBIENT_PROFILE, options.reducedMotion === true);
}
