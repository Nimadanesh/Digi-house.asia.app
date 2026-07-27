"use client";
// File responsibility: in-page sticky Buy Share CTA (pairs with Telegram MainButton when available).
export function StickyBuyBar({
  disabled,
  onClick,
  label = "Buy Share",
}: {
  disabled?: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[480px] px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-2"
      data-testid="sticky-buy-bar"
    >
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className="pointer-events-auto flex h-[52px] w-full items-center justify-center rounded-[12px] bg-primary text-[0.9375rem] font-semibold text-primary-foreground shadow-[0_4px_16px_rgba(51,144,236,0.35)] active:scale-[0.98] transition-transform duration-[120ms] ease-out disabled:opacity-50"
      >
        {label}
      </button>
    </div>
  );
}
