import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmActionSheet } from "@/components/common/ConfirmActionSheet";

const base = {
  open: true,
  onClose: vi.fn(),
  title: "Unlock shares",
  description: "Unlocking stops yield on these shares now.",
  details: [
    { label: "Property", value: "Villa One" },
    { label: "Shares", value: 5 },
    { label: "Accrued unpaid", value: "$12.00", valueClass: "text-success" },
  ],
  confirmLabel: "Confirm unlock",
  pendingLabel: "Unlocking…",
  onConfirm: vi.fn(),
  testId: "unlock-confirm",
};

function renderSheet(overrides: Partial<React.ComponentProps<typeof ConfirmActionSheet>> = {}) {
  return render(<ConfirmActionSheet {...base} {...overrides} />);
}

describe("ConfirmActionSheet", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders title, description and detail rows", () => {
    renderSheet();
    expect(screen.getByText("Unlock shares")).toBeInTheDocument();
    expect(screen.getByText("Unlocking stops yield on these shares now.")).toBeInTheDocument();
    expect(screen.getByText("Property")).toBeInTheDocument();
    expect(screen.getByText("Villa One")).toBeInTheDocument();
    expect(screen.getByText("Shares")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("renders nothing when closed", () => {
    const { container } = renderSheet({ open: false });
    expect(container).toBeEmptyDOMElement();
  });

  it("confirm fires onConfirm and not onClose", () => {
    renderSheet();
    fireEvent.click(screen.getByTestId("unlock-confirm-confirm"));
    expect(base.onConfirm).toHaveBeenCalledTimes(1);
    expect(base.onClose).not.toHaveBeenCalled();
  });

  it("cancel fires onClose and not onConfirm", () => {
    renderSheet();
    fireEvent.click(screen.getByTestId("unlock-confirm-cancel"));
    expect(base.onClose).toHaveBeenCalledTimes(1);
    expect(base.onConfirm).not.toHaveBeenCalled();
  });

  it("pending disables confirm, hides cancel and shows the pending label", () => {
    renderSheet({ pending: true });
    const confirm = screen.getByTestId("unlock-confirm-confirm");
    expect(confirm).toBeDisabled();
    expect(confirm).toHaveTextContent("Unlocking…");
    expect(screen.queryByTestId("unlock-confirm-cancel")).not.toBeInTheDocument();
    fireEvent.click(confirm);
    expect(base.onConfirm).not.toHaveBeenCalled();
  });

  it("shows a recoverable error and keeps the confirm (retry) path", () => {
    renderSheet({ error: "Unable to unlock shares — please try again." });
    const err = screen.getByTestId("unlock-confirm-error");
    expect(err).toHaveTextContent("Unable to unlock shares");
    expect(err).toHaveAttribute("role", "alert");
    expect(screen.getByTestId("unlock-confirm-confirm")).toBeEnabled();
  });

  it("success swaps the body for the completion state; Done closes", () => {
    renderSheet({
      success: { title: "Unlock requested", message: "Yield has stopped." },
    });
    expect(screen.getByTestId("unlock-confirm-success")).toBeInTheDocument();
    expect(screen.getByText("Unlock requested")).toBeInTheDocument();
    expect(screen.queryByTestId("unlock-confirm-confirm")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("unlock-confirm-done"));
    expect(base.onClose).toHaveBeenCalledTimes(1);
  });
});
