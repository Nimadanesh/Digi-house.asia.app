import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

// Minimal render to prove RTL + jsdom + jest-dom are wired. If this breaks, the whole
// component-test harness is broken — fix before any other test file.
function Clickable({ label }: { label: string }) {
  return <button type="button">{label}</button>;
}

describe("test harness sanity", () => {
  it("renders a button and resolves a jest-dom matcher", () => {
    render(<Clickable label="tap me" />);
    expect(screen.getByRole("button", { name: "tap me" })).toBeInTheDocument();
  });
});