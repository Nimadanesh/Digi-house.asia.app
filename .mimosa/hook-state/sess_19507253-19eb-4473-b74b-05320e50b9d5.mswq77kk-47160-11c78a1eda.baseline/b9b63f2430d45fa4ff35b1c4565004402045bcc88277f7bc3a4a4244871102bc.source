import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  buildInitDataForTests,
  FIXTURE_BOT_TOKEN,
} from "./test-fixtures.js";
import { validateInitData } from "./validate-init-data.js";

const NOW = new Date("2026-07-29T12:00:00.000Z");
const NOW_UNIX = Math.floor(NOW.getTime() / 1000);

describe("validateInitData", () => {
  it("accepts valid fresh initData with correct token", () => {
    const initData = buildInitDataForTests(FIXTURE_BOT_TOKEN, {
      authDate: NOW_UNIX - 60,
      user: {
        id: 123456789,
        first_name: "Aria",
        last_name: "Demo",
        username: "aria",
        photo_url: "https://example.com/a.jpg",
      },
    });

    const result = validateInitData(initData, FIXTURE_BOT_TOKEN, { now: NOW });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.userId).toBe("123456789");
    expect(result.username).toBe("aria");
    expect(result.displayName).toBe("Aria Demo");
    expect(result.photoUrl).toBe("https://example.com/a.jpg");
    expect(result.authDate.toISOString()).toBe(
      new Date((NOW_UNIX - 60) * 1000).toISOString(),
    );
  });

  it("rejects wrong bot token (invalid_hash)", () => {
    const initData = buildInitDataForTests(FIXTURE_BOT_TOKEN, {
      authDate: NOW_UNIX,
      user: { id: 1, first_name: "A" },
    });

    const result = validateInitData(initData, "other-token", { now: NOW });

    expect(result).toMatchObject({ ok: false, code: "invalid_hash" });
  });

  it("rejects tampered user id after signing (invalid_hash)", () => {
    const initData = buildInitDataForTests(FIXTURE_BOT_TOKEN, {
      authDate: NOW_UNIX,
      user: { id: 1, first_name: "A" },
    });
    const params = new URLSearchParams(initData);
    params.set(
      "user",
      JSON.stringify({ id: 999, first_name: "A" }),
    );

    const result = validateInitData(params.toString(), FIXTURE_BOT_TOKEN, {
      now: NOW,
    });

    expect(result).toMatchObject({ ok: false, code: "invalid_hash" });
  });

  it("rejects missing hash (malformed)", () => {
    const initData = buildInitDataForTests(FIXTURE_BOT_TOKEN, {
      authDate: NOW_UNIX,
      user: { id: 1, first_name: "A" },
    });
    const params = new URLSearchParams(initData);
    params.delete("hash");

    const result = validateInitData(params.toString(), FIXTURE_BOT_TOKEN, {
      now: NOW,
    });

    expect(result).toMatchObject({ ok: false, code: "malformed" });
  });

  it("rejects empty / garbage string (malformed)", () => {
    expect(validateInitData("", FIXTURE_BOT_TOKEN, { now: NOW })).toMatchObject({
      ok: false,
      code: "malformed",
    });
    expect(
      validateInitData("not=valid&hash=zz", FIXTURE_BOT_TOKEN, { now: NOW }),
    ).toMatchObject({ ok: false, code: "malformed" });
  });

  it("rejects expired auth_date", () => {
    const maxAgeSeconds = 3600;
    const initData = buildInitDataForTests(FIXTURE_BOT_TOKEN, {
      authDate: NOW_UNIX - maxAgeSeconds - 1,
      user: { id: 42, first_name: "Old" },
    });

    const result = validateInitData(initData, FIXTURE_BOT_TOKEN, {
      now: NOW,
      maxAgeSeconds,
    });

    expect(result).toMatchObject({ ok: false, code: "expired" });
  });

  it("rejects valid hash but missing user (missing_user)", () => {
    const pairs: Record<string, string> = {
      auth_date: String(NOW_UNIX),
      query_id: "AAE",
    };
    const dataCheckString = Object.keys(pairs)
      .sort()
      .map((k) => `${k}=${pairs[k]}`)
      .join("\n");
    const secretKey = createHmac("sha256", "WebAppData")
      .update(FIXTURE_BOT_TOKEN)
      .digest();
    const hash = createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");
    const initData = new URLSearchParams({ ...pairs, hash }).toString();

    const result = validateInitData(initData, FIXTURE_BOT_TOKEN, { now: NOW });

    expect(result).toMatchObject({ ok: false, code: "missing_user" });
  });

  it("coerces numeric user id to string", () => {
    const initData = buildInitDataForTests(FIXTURE_BOT_TOKEN, {
      authDate: NOW_UNIX,
      user: { id: 7, first_name: "Seven" },
    });
    const result = validateInitData(initData, FIXTURE_BOT_TOKEN, { now: NOW });
    expect(result.ok && result.userId).toBe("7");
  });
});

