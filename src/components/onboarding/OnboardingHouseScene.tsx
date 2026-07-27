"use client";
// File responsibility: lightweight CSS fraction-house for onboarding (no WebGL / Three.js).
// Cheap on mobile Telegram WebViews; respects prefers-reduced-motion.
export function OnboardingHouseScene() {
  return (
    <div
      className="mx-auto flex h-52 w-full max-w-[280px] items-center justify-center"
      data-testid="onboarding-house-scene"
      aria-hidden
    >
      <div className="dh-fraction-house relative size-[140px]">
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-1.5 p-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-[12px] border border-primary/35 bg-primary/25 shadow-inner"
              style={{
                animation: "dh-tile-bob 2.4s ease-in-out infinite",
                animationDelay: `${i * 0.18}s`,
                background:
                  i === 0
                    ? "color-mix(in oklab, var(--color-primary) 55%, transparent)"
                    : i === 1
                      ? "color-mix(in oklab, var(--color-primary) 40%, transparent)"
                      : i === 2
                        ? "color-mix(in oklab, var(--color-primary) 35%, #232e3c)"
                        : "color-mix(in oklab, var(--color-primary) 50%, #17212b)",
              }}
            />
          ))}
        </div>
        <div
          className="absolute left-1/2 top-1 h-0 w-0 -translate-x-1/2 border-l-[52px] border-r-[52px] border-b-[36px] border-l-transparent border-r-transparent border-b-card"
          style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.25))" }}
        />
      </div>
    </div>
  );
}
