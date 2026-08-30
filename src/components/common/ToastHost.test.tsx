import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { ToastHost } from "@/components/common/ToastHost";
import { useUiStore } from "@/stores/ui.store";

describe("ToastHost", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useUiStore.setState({ toast: null });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing until a toast is pushed", () => {
    const { container } = render(<ToastHost />);
    expect(container).toBeEmptyDOMElement();
    act(() => {
      useUiStore.getState().pushToast("success", "Sell order placed");
    });
    expect(screen.getByText("Sell order placed")).toBeInTheDocument();
  });

  it("leaves after 3s and unmounts after the exit animation window", () => {
    render(<ToastHost />);
    act(() => {
      useUiStore.getState().pushToast("success", "Portfolio exported");
    });
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    // Leaving stage still mounted (160ms exit animation).
    expect(screen.getByText("Portfolio exported")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.queryByText("Portfolio exported")).not.toBeInTheDocument();
  });

  it("error toasts render with alert semantics", () => {
    render(<ToastHost />);
    act(() => {
      useUiStore.getState().pushToast("error", "Export failed", "Please try again.");
    });
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Please try again.")).toBeInTheDocument();
  });

  it("a new toast replaces the previous one (single slot, no stacking)", () => {
    render(<ToastHost />);
    act(() => {
      useUiStore.getState().pushToast("success", "First");
    });
    act(() => {
      useUiStore.getState().pushToast("success", "Second");
    });
    expect(screen.getByText("Second")).toBeInTheDocument();
    expect(screen.queryByText("First")).not.toBeInTheDocument();
  });
});
