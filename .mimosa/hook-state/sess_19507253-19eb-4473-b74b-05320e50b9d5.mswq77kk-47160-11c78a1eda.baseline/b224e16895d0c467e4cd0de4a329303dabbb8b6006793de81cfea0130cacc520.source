// File responsibility: vitest global setup — jest-dom matchers, cleanup, next-intl English catalog.
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import en from "../messages/en.json";

afterEach(() => {
  cleanup();
});

type Messages = typeof en;

function lookup(messages: unknown, path: string): string | undefined {
  const parts = path.split(".");
  let cur: unknown = messages;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === "string" ? cur : undefined;
}

function format(template: string, values?: Record<string, string | number | Date>): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const v = values[key];
    return v == null ? `{${key}}` : String(v);
  });
}

vi.mock("next-intl", () => ({
  useTranslations: (namespace?: string) => {
    return (key: string, values?: Record<string, string | number | Date>) => {
      const path = namespace ? `${namespace}.${key}` : key;
      const raw = lookup(en as Messages, path) ?? key;
      return format(raw, values);
    };
  },
  useLocale: () => "en",
  NextIntlClientProvider: ({ children }: { children: unknown }) => children,
}));

// Telegram signal used by LocaleProvider — safe default outside TMA.
vi.mock("@telegram-apps/sdk-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@telegram-apps/sdk-react")>();
  return {
    ...actual,
    useSignal: () => undefined,
  };
});
