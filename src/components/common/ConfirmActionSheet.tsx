"use client";
// File responsibility: generic confirm/action sheet (domain-neutral) — intent → details →
// confirm with loading → success, error with retry. The caller owns the mutation and
// haptics; this component only renders the state machine from its props so the same
// interaction language is used by unlock, cancel-order, disconnect, etc.
// Copy follows the sheet convention (English strings, like BuyQtyStep / SellSheet).
import { Check } from "lucide-react";
import { Sheet } from "./Sheet";
import { Block } from "./Block";
import { Row } from "./Row";

export interface ConfirmDetail {
  label: string;
  value: React.ReactNode;
  /** Optional text-color class for the value (e.g. "text-success", "text-danger"). */
  valueClass?: string;
}

export function ConfirmActionSheet({
  open,
  onClose,
  title,
  description,
  details = [],
  confirmLabel,
  cancelLabel = "Cancel",
  pending = false,
  pendingLabel = "Working…",
  error = null,
  success = null,
  onConfirm,
  testId = "confirm-action-sheet",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  /** One-line answer to "what does this do?" — shown above the details. */
  description?: string;
  details?: ConfirmDetail[];
  confirmLabel: string;
  cancelLabel?: string;
  /** True while the caller's mutation is in flight — confirm disabled, cancel hidden. */
  pending?: boolean;
  pendingLabel?: string;
  /** Human-readable failure; the confirm button acts as the retry path. */
  error?: string | null;
  /** Set once the mutation succeeded — swaps the body for the completion state. */
  success?: { title: string; message: string } | null;
  onConfirm: () => void;
  testId?: string;
}) {
  const done = success != null;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      labelledBy={`${testId}-title`}
      dismissible={!pending && !done}
    >
      {done ? (
        <div className="space-y-4 pb-3 text-center" data-testid={`${testId}-success`}>
          <div
            className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/15"
            style={{ animation: "dh-fade-in 160ms ease-out" }}
          >
            <Check size={28} strokeWidth={2.25} className="text-success" aria-hidden />
          </div>
          <div className="space-y-1.5">
            <h2
              id={`${testId}-title`}
              className="text-[1.0625rem] font-semibold leading-snug text-foreground"
            >
              {success.title}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{success.message}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-testid={`${testId}-done`}
            className="h-[48px] w-full rounded-[12px] bg-primary text-[0.9375rem] font-semibold text-primary-foreground active:scale-[0.98] transition-transform duration-[120ms] ease-out"
          >
            Done
          </button>
        </div>
      ) : (
        <div className="space-y-4 pb-2" data-testid={testId}>
          <h2
            id={`${testId}-title`}
            className="text-[1.0625rem] font-semibold leading-snug text-foreground"
          >
            {title}
          </h2>
          {description ? (
            <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
          ) : null}

          {details.length > 0 ? (
            <Block>
              {details.map((d) => (
                <Row key={d.label}>
                  <span className="text-sm text-muted-foreground">{d.label}</span>
                  <span
                    className={`ml-auto max-w-[60%] truncate text-right text-sm tnum font-medium text-foreground ${d.valueClass ?? ""}`}
                  >
                    {d.value}
                  </span>
                </Row>
              ))}
            </Block>
          ) : null}

          {error ? (
            <p className="text-xs text-danger text-center" role="alert" data-testid={`${testId}-error`}>
              {error}
            </p>
          ) : null}

          <div className="flex gap-2">
            {!pending ? (
              <button
                type="button"
                onClick={onClose}
                data-testid={`${testId}-cancel`}
                className="h-[48px] flex-1 rounded-[12px] bg-surface-2 text-sm font-medium text-foreground active:scale-[0.98] transition-transform duration-[120ms] ease-out"
              >
                {cancelLabel}
              </button>
            ) : null}
            <button
              type="button"
              disabled={pending}
              onClick={onConfirm}
              data-testid={`${testId}-confirm`}
              className="h-[48px] flex-1 rounded-[12px] bg-primary text-sm font-semibold text-primary-foreground active:scale-[0.98] transition-transform duration-[120ms] ease-out disabled:opacity-40"
            >
              {pending ? pendingLabel : confirmLabel}
            </button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
