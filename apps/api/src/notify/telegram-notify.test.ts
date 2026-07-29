import { describe, expect, it, vi } from "vitest";
import { sendTelegramMessage } from "./telegram-notify.js";

describe("sendTelegramMessage", () => {
  it("returns error when botToken is empty", async () => {
    const result = await sendTelegramMessage({
      botToken: "",
      chatId: "12345",
      text: "hello",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toContain("TELEGRAM_BOT_TOKEN");
  });

  it("returns error on network failure (invalid token)", async () => {
    const result = await sendTelegramMessage({
      botToken: "INVALID_TOKEN_HERE",
      chatId: "12345",
      text: "hello",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns error on HTTP failure (400 bad request)", async () => {
    const result = await sendTelegramMessage({
      botToken: "9999999999:fake_token_00000000000000",
      chatId: "",
      text: "hello",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("aborts on timeout", { timeout: 10_000 }, async () => {
    // Mock fetch to hang until aborted, then reject with AbortError
    const originalFetch = globalThis.fetch;
    let abortHandler: (() => void) | null = null;
    globalThis.fetch = ((_url: string, opts?: RequestInit) => {
      const signal = opts?.signal;
      if (signal) {
        signal.addEventListener("abort", () => {
          abortHandler?.();
        });
      }
      return new Promise<Response>((_resolve, reject) => {
        abortHandler = () => reject(new Error("The operation was aborted"));
      });
    }) as typeof fetch;

    try {
      const result = await sendTelegramMessage({
        botToken: "12345:abc",
        chatId: "1",
        text: "hi",
      });
      expect(result.ok).toBe(false);
      expect(result.error).toBeDefined();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
