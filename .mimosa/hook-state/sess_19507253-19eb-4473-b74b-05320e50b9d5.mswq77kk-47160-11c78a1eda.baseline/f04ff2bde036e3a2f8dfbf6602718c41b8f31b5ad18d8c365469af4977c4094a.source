export type SendTelegramMessageInput = {
  botToken: string;
  chatId: string;
  text: string;
};

export type SendTelegramMessageResult = {
  ok: boolean;
  error?: string;
};

/**
 * Send a text message via Telegram Bot API.
 * Fail-open: returns { ok: false, error } instead of throwing.
 */
export async function sendTelegramMessage(
  input: SendTelegramMessageInput,
): Promise<SendTelegramMessageResult> {
  const { botToken, chatId, text } = input;

  if (!botToken) {
    return { ok: false, error: "TELEGRAM_BOT_TOKEN not configured" };
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5_000);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const body = await res.text().catch(() => "(no body)");
      return { ok: false, error: `Telegram API ${res.status}: ${body}` };
    }

    return { ok: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "unknown fetch error";
    return { ok: false, error: message };
  }
}
