import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorState } from "@/components/common/ErrorState";

describe("ErrorState", () => {
  it("renders message and Try Again; calls onRetry", () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Couldn't load data." onRetry={onRetry} data-testid="test-error" />);
    expect(screen.getByTestId("test-error")).toBeInTheDocument();
    expect(screen.getByText("Couldn't load data.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
