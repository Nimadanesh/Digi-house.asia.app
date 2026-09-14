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

// Test-side translator: plain interpolation + a `rich` twin that strips the
// ICU rich-text tags (e.g. "<value>{valueText}</value>" → the interpolated
// text) so components using t.rich render honest strings in tests.
function makeTranslator(namespace?: string) {
  const resolve = (key: string) => {
    const path = namespace ? `${namespace}.${key}` : key;
    return lookup(en as Messages, path) ?? key;
  };
  const translate = (key: string, values?: Record<string, string | number | Date>) =>
    format(resolve(key), values);
  translate.rich = (
    key: string,
    values?: Record<string, string | number | Date | ((chunks: string) => unknown)>,
  ): string => {
    const raw = resolve(key);
    const plain = Object.fromEntries(
      Object.entries(values ?? {}).filter(([, v]) => typeof v !== "function"),
    ) as Record<string, string | number | Date>;
    return format(raw, plain).replace(/<\/?[a-zA-Z]+>/g, "");
  };
  return translate;
}

vi.mock("next-intl", () => ({
  useTranslations: (namespace?: string) => makeTranslator(namespace),
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
