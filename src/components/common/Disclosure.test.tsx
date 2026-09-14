// Tests for the shared Disclosure primitive: header toggle semantics,
// trailing slot, conditional content, stable testids for consumers.
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { Disclosure } from "@/components/common/Disclosure";

function renderDisclosure(open = false, onOpenChange = () => {}) {
  return render(
    <Disclosure
      title={<span>Cost structure</span>}
      trailing={<span data-testid="trailing">total</span>}
      open={open}
      onOpenChange={onOpenChange}
      toggleTestId="toggle"
      contentTestId="content"
    >
      <p>breakdown</p>
    </Disclosure>,
  );
}

describe("Disclosure", () => {
  it("renders the header collapsed with aria-expanded=false", () => {
    renderDisclosure();
    expect(screen.getByTestId("toggle")).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByTestId("content")).not.toBeInTheDocument();
  });

  it("notifies on toggle and renders content when open", () => {
    const onOpenChange = vi.fn();
    const view = render(
      <Disclosure
        title={<span>Cost structure</span>}
        open={false}
        onOpenChange={onOpenChange}
        toggleTestId="toggle"
        contentTestId="content"
      >
        <p>breakdown</p>
      </Disclosure>,
    );
    fireEvent.click(screen.getByTestId("toggle"));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    view.rerender(
      <Disclosure
        title={<span>Cost structure</span>}
        open
        onOpenChange={onOpenChange}
        toggleTestId="toggle"
        contentTestId="content"
      >
        <p>breakdown</p>
      </Disclosure>,
    );
    expect(screen.getByTestId("content")).toHaveTextContent("breakdown");
    expect(screen.getByTestId("toggle")).toHaveAttribute("aria-expanded", "true");
  });
});
