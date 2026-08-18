"use client";
// File responsibility: one shared 1s tick for all countdown UI (avoids N intervals).
import { useSyncExternalStore } from "react";

let nowMs = 0;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function emit() {
  nowMs = Date.now();
  listeners.forEach((l) => l());
}

function start() {
  if (timer != null) return;
  nowMs = Date.now();
  timer = setInterval(emit, 1000);
}

function stop() {
  if (timer == null || listeners.size > 0) return;
  clearInterval(timer);
  timer = null;
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  start();
  return () => {
    listeners.delete(onStoreChange);
    stop();
  };
}

function getSnapshot() {
  if (nowMs === 0) nowMs = Date.now();
  return nowMs;
}

function getServerSnapshot() {
  return 1_700_000_000_000; // stable SSR placeholder
}

/** Shared epoch ms, ticks once per second app-wide. */
export function useSharedNowMs(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
