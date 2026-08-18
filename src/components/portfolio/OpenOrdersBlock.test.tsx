import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OpenOrdersBlock } from "@/components/portfolio/OpenOrdersBlock";
import type { Order } from "@/types/order";

const openOrder: Order = {
  id: "ord-open",
  propertyId: "prop-bayside-marina-penthouse",
  makerAddress: "EQ",
  side: "sell",
  priceUsd: 26_000,
  quantity: 5,
  filledQuantity: 0,
  status: "open",
  createdAt: "2026-07-18T00:00:00Z",
};

const queuedOrder: Order = {
  ...openOrder,
  id: "ord-queued",
  status: "queued",
};

const filledOrder: Order = {
  ...openOrder,
  id: "ord-filled",
  status: "filled",
};

const names = { "prop-bayside-marina-penthouse": "Bayside Marina Penthouse" };

describe("OpenOrdersBlock — PD-08", () => {
  it("renders open and queued orders with a cancel button each", () => {
    render(
      <OpenOrdersBlock
        orders={[openOrder, queuedOrder]}
        nameById={names}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getAllByText("Bayside Marina Penthouse").length).toBe(2);
    expect(screen.getByTestId("cancel-order-ord-open")).toBeInTheDocument();
    expect(screen.getByTestId("cancel-order-ord-queued")).toBeInTheDocument();
  });

  it("calls onCancel with the order id when cancel is tapped", () => {
    const onCancel = vi.fn();
    render(
      <OpenOrdersBlock orders={[openOrder]} nameById={names} onCancel={onCancel} />,
    );
    fireEvent.click(screen.getByTestId("cancel-order-ord-open"));
    expect(onCancel).toHaveBeenCalledWith("ord-open");
  });

  it("does not render a cancel button for terminal (filled) orders", () => {
    render(
      <OpenOrdersBlock orders={[filledOrder]} nameById={names} onCancel={vi.fn()} />,
    );
    expect(screen.queryByTestId("cancel-order-ord-filled")).not.toBeInTheDocument();
  });

  it("renders no cancel buttons when onCancel is omitted (read-only)", () => {
    render(<OpenOrdersBlock orders={[openOrder]} nameById={names} />);
    expect(screen.queryByTestId("cancel-order-ord-open")).not.toBeInTheDocument();
  });

  it("disables the cancel button while that order is cancelling", () => {
    render(
      <OpenOrdersBlock
        orders={[openOrder]}
        nameById={names}
        onCancel={vi.fn()}
        cancellingId="ord-open"
      />,
    );
    expect(screen.getByTestId("cancel-order-ord-open")).toBeDisabled();
  });

  it("renders nothing when there are no orders", () => {
    const { container } = render(
      <OpenOrdersBlock orders={[]} nameById={names} onCancel={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });
});
