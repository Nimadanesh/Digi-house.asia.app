import { afterEach, describe, expect, it, vi } from "vitest";
import { sendOpsAlert, type OpsNotifyDeps } from "./ops-alert.js";

const DEPS: OpsNotifyDeps = {
  botToken: "123:abc",
  chatId: "-100ops",
};

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("sendOpsAlert", () => {
  it("sends a formatted alert and returns true on success", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("ok", { status: 200 }),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const ok = await sendOpsAlert(DEPS, {
      subject: "Yield job failed (tick:yield)",
      details: { queue: "digihouse-yield" },
      err: new Error("boom"),
    });

    expect(ok).toBe(true);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://api.telegram.org/bot123:abc/sendMessage");
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.chat_id).toBe("-100ops");
    expect(body.text).toContain("DigiHouse ops alert");
    expect(body.text).toContain("Yield job failed");
    expect(body.text).toContain("boom");
    expect(body.text).toContain("digihouse-yield");
  });

  it("escapes HTML in the subject and error text", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("ok", { status: 200 }),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await sendOpsAlert(DEPS, {
      subject: "match <b>guard</b> & trip",
      details: { id: "a<b>" },
    });

    const body = JSON.parse(
      (fetchMock.mock.calls[0]![1] as RequestInit).body as string,
    );
    expect(body.text).toContain("match &lt;b&gt;guard");
    expect(body.text).not.toContain("match <b>guard");
    expect(body.text).toContain("&amp;");
  });

  it("returns false (does not throw) when the API rejects", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response("unauthorized", { status: 401 }),
    ) as unknown as typeof fetch;

    const ok = await sendOpsAlert(DEPS, { subject: "x" });
    expect(ok).toBe(false);
  });

  it("returns false (does not throw) when fetch itself throws", async () => {
    globalThis.fetch = vi
      .fn()
      .mockRejectedValue(new Error("network down")) as unknown as typeof fetch;

    const ok = await sendOpsAlert(DEPS, { subject: "x" });
    expect(ok).toBe(false);
  });
});
