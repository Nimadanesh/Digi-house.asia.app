// File responsibility: safe Telegram chrome (BackButton / MainButton) calls.
// Outside Mini Apps, methods no-op. Never throw into React render/effects.
// IMPORTANT: methods must NOT rely on `this` — they are often passed unbound.

import { backButton, mainButton, isTMA } from "./signals";

type MaybeSafeFn = ((...args: never[]) => unknown) & { isAvailable?: () => boolean };

function canUse(fn: unknown): fn is MaybeSafeFn {
  if (typeof window === "undefined") return false;
  if (typeof fn !== "function") return false;
  try {
    const avail = (fn as MaybeSafeFn).isAvailable;
    if (typeof avail === "function" && !avail.call(fn)) return false;
  } catch {
    return false;
  }
  return true;
}

function safeCall(fn: unknown, ...args: unknown[]): boolean {
  if (!canUse(fn)) return false;
  try {
    (fn as (...a: unknown[]) => unknown)(...args);
    return true;
  } catch {
    return false;
  }
}

/** Legacy Telegram WebApp bridge (some clients expose only this). */
function legacyWebApp(): {
  BackButton?: { show: () => void; hide: () => void; onClick: (cb: () => void) => void; offClick?: (cb: () => void) => void };
  MainButton?: {
    show: () => void;
    hide: () => void;
    setText: (t: string) => void;
    onClick: (cb: () => void) => void;
    offClick?: (cb: () => void) => void;
    enable?: () => void;
    disable?: () => void;
    showProgress?: (leaveActive?: boolean) => void;
    hideProgress?: () => void;
  };
} | null {
  if (typeof window === "undefined") return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    return w.Telegram?.WebApp ?? null;
  } catch {
    return null;
  }
}

function tryMountBack(): void {
  // SDK 3.x — mount if present; never throws.
  const mount = (backButton as { mount?: unknown }).mount;
  safeCall(mount);
}

export const safeBackButton = {
  show(): void {
    tryMountBack();
    if (safeCall((backButton as { show?: unknown }).show)) return;
    // Legacy fallback
    try {
      legacyWebApp()?.BackButton?.show();
    } catch {
      /* ignore */
    }
  },

  hide(): void {
    if (safeCall((backButton as { hide?: unknown }).hide)) return;
    try {
      legacyWebApp()?.BackButton?.hide();
    } catch {
      /* ignore */
    }
  },

  onClick(fn: () => void): () => void {
    tryMountBack();
    const bind = (backButton as { onClick?: unknown }).onClick;
    if (canUse(bind)) {
      try {
        (bind as (h: () => void) => void)(fn);
        return () => {
          const off = (backButton as { offClick?: unknown }).offClick;
          safeCall(off, fn);
        };
      } catch {
        /* fall through to legacy */
      }
    }
    // Legacy fallback
    try {
      const bb = legacyWebApp()?.BackButton;
      if (bb?.onClick) {
        bb.onClick(fn);
        return () => {
          try {
            bb.offClick?.(fn);
          } catch {
            /* ignore */
          }
        };
      }
    } catch {
      /* ignore */
    }
    return () => {};
  },
};

export interface MainButtonParams {
  text?: string;
  color?: string;
  textColor?: string;
  isEnabled?: boolean;
  isVisible?: boolean;
  isLoaderVisible?: boolean;
}

export const safeMainButton = {
  setParams(params: MainButtonParams): void {
    const setParams = (mainButton as { setParams?: unknown }).setParams;
    if (canUse(setParams)) {
      try {
        (setParams as (p: MainButtonParams) => void)({ isVisible: true, ...params });
        return;
      } catch {
        /* legacy */
      }
    }
    try {
      const mb = legacyWebApp()?.MainButton;
      if (!mb) return;
      if (params.text) mb.setText(params.text);
      if (params.isEnabled === false) mb.disable?.();
      else mb.enable?.();
      if (params.isLoaderVisible) mb.showProgress?.(false);
      else mb.hideProgress?.();
      if (params.isVisible === false) mb.hide();
      else mb.show();
    } catch {
      /* ignore */
    }
  },

  hide(): void {
    const setParams = (mainButton as { setParams?: unknown }).setParams;
    if (canUse(setParams)) {
      try {
        (setParams as (p: MainButtonParams) => void)({ isVisible: false });
        return;
      } catch {
        /* legacy */
      }
    }
    try {
      legacyWebApp()?.MainButton?.hide();
    } catch {
      /* ignore */
    }
  },

  onClick(fn: () => void): () => void {
    const bind = (mainButton as { onClick?: unknown }).onClick;
    if (canUse(bind)) {
      try {
        (bind as (h: () => void) => void)(fn);
        return () => {
          const off = (mainButton as { offClick?: unknown }).offClick;
          safeCall(off, fn);
        };
      } catch {
        /* legacy */
      }
    }
    try {
      const mb = legacyWebApp()?.MainButton;
      if (mb?.onClick) {
        mb.onClick(fn);
        return () => {
          try {
            mb.offClick?.(fn);
          } catch {
            /* ignore */
          }
        };
      }
    } catch {
      /* ignore */
    }
    return () => {};
  },
};

// Silence unused import warning if tree-shaken isTMA — keep for future env checks
void isTMA;
