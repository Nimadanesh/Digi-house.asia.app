// File responsibility: PF-05 — fail-open Telegram alerting for background-job and
// match failures. Alerting must never break the job path that failed, so every
// send is wrapped and returns a boolean instead of throwing.
import type { Logger } from "../logger.js";
import { sendTelegramMessage } from "./telegram-notify.js";

export type OpsNotifyDeps = {
  botToken: string;
  /** Telegram chat id of the ops channel (user or group). */
  chatId: string;
  log?: Logger;
};

/**
 * Send a formatted ops alert. Fail-open: never throws; returns whether the
 * message was accepted by the Telegram API. Logs a warning on failure.
 */
export async function sendOpsAlert(
  deps: OpsNotifyDeps,
  input: {
    subject: string;
    details?: unknown;
    err?: unknown;
  },
): Promise<boolean> {
  try {
    const detailText =
      input.details !== undefined
        ? `\n<code>${escapeHtml(JSON.stringify(input.details, null, 2).slice(0, 1500))}</code>`
        : "";
    const errText = input.err
      ? `\n<code>${escapeHtml(
          input.err instanceof Error ? input.err.message : String(input.err),
        ).slice(0, 800)}</code>`
      : "";
    const result = await sendTelegramMessage({
      botToken: deps.botToken,
      chatId: deps.chatId,
      text: `🚨 DigiHouse ops alert\n<b>${escapeHtml(input.subject)}</b>${detailText}${errText}`,
    });
    if (!result.ok) {
      deps.log?.warn(
        { error: result.error, chatId: deps.chatId },
        "ops alert send failed",
      );
      return false;
    }
    return true;
  } catch (err) {
    deps.log?.warn({ err }, "ops alert threw");
    return false;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
