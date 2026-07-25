import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Toggle } from "@/components/common/Toggle";

describe("Toggle — accessible iOS-style switch", () => {
  it("has role=switch and reflects on/off via aria-checked", () => {
    const onChange = vi.fn();
    const { rerender } = render(<Toggle on={false} onChange={onChange} aria-label="Use Telegram theme" />);
    const sw = screen.getByRole("switch");
    expect(sw).toHaveAttribute("aria-checked", "false");
    expect(sw).toHaveAccessibleName("Use Telegram theme");
    rerender(<Toggle on={true} onChange={onChange} aria-label="Use Telegram theme" />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("on background is --primary (bg-primary), off is --surface-2 (bg-surface-2)", () => {
    const { rerender } = render(<Toggle on={true} onChange={() => {}} aria-label="t" />);
    expect(screen.getByRole("switch").className).toContain("bg-primary");
    rerender(<Toggle on={false} onChange={() => {}} aria-label="t" />);
    expect(screen.getByRole("switch").className).toContain("bg-surface-2");
  });

  it("a click calls onChange with the flipped value", () => {
    const onChange = vi.fn();
    render(<Toggle on={false} onChange={onChange} aria-label="t" />);
    fireEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});