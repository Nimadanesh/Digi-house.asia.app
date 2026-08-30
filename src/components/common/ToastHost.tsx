"use client";
// File responsibility: global toast host — renders the ui.store toast slot with the
// two-stage lifecycle (visible → leaving → unmount). Timers live here so pushers
// (mutation hooks, sheets) stay free of lifetime logic, matching the Toast contract.
import { useEffect } from "react";
import { Toast } from "./Toast";
import { useUiStore, type UiToast } from "@/stores/ui.store";

const SHOW_MS = 3000;
const LEAVE_MS = 160;

function ToastItem({ toast }: { toast: UiToast }) {
  const markToastLeaving = useUiStore((s) => s.markToastLeaving);
  const clearToast = useUiStore((s) => s.clearToast);

  useEffect(() => {
    if (toast.leaving) {
      const t = setTimeout(clearToast, LEAVE_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(markToastLeaving, SHOW_MS);
    return () => clearTimeout(t);
  }, [toast.leaving, toast.id, markToastLeaving, clearToast]);

  return <Toast tone={toast.tone} title={toast.title} sub={toast.sub} leaving={toast.leaving} />;
}

export function ToastHost() {
  const toast = useUiStore((s) => s.toast);
  if (!toast) return null;
  return <ToastItem key={toast.id} toast={toast} />;
}
