// File responsibility: vitest global setup — registers @testing-library/jest-dom DOM matchers
// (toBeInTheDocument, toHaveAttribute, toHaveClass, toHaveStyle, etc.) for every test file.
// Run once per test file via vitest `setupFiles`. No test logic lives here.
import "@testing-library/jest-dom/vitest";
// RTL auto-cleanup only self-registers when a global `afterEach` exists; vitest runs with
// `globals: false`, so cleanup must be wired explicitly here. Without it, `render` calls
// accumulate in `document.body` across tests in a file and `getBy*` queries hit stale DOM.
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});