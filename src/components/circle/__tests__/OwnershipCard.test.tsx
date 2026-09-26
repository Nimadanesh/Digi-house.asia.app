import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const { shareOwnershipMock, copyOwnershipMock } = vi.hoisted(() => ({
  shareOwnershipMock: vi.fn(),
  copyOwnershipMock: vi.fn(),
}));

const useShareOwnershipMock = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/useShareOwnership", () => ({
  useShareOwnership: (...args: unknown[]) => useShareOwnershipMock(...args),
}));

import { OwnershipCard } from "@/components/circle/OwnershipCard";

const props = { estateId: "re-128862", estateTitle: "Grand Villa", location: "Maldives", ownedShares: 20 };

describe("OwnershipCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useShareOwnershipMock.mockReturnValue({
      shareLink: "https://t.me/Bot?startapp=own_re-128862_ref_u1",
      canShare: true,
      isLoggedIn: true,
      copied: false,
      shareOwnership: shareOwnershipMock,
      copyOwnership: copyOwnershipMock,
    });
  });

  it("renders the ownership statement with estate identity and no financial metrics", () => {
    const { container } = render(<OwnershipCard {...props} />);
    expect(screen.getByTestId("estate-ownership")).toBeInTheDocument();
    expect(screen.getByText("I own a piece of")).toBeInTheDocument();
    expect(screen.getByText("Grand Villa")).toBeInTheDocument();
    expect(screen.getByText("Maldives")).toBeInTheDocument();
    expect(useShareOwnershipMock).toHaveBeenCalledWith("re-128862", "Grand Villa");
    expect(container.textContent).not.toMatch(/\$\d|%|point|yield|ROI/i);
    fireEvent.click(screen.getByTestId("estate-ownership-share"));
    expect(shareOwnershipMock).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId("estate-ownership-copy"));
    expect(copyOwnershipMock).toHaveBeenCalledTimes(1);
  });

  it("shows copied feedback after a successful copy", () => {
    useShareOwnershipMock.mockReturnValue({
      shareLink: "https://t.me/Bot?startapp=own_re-128862_ref_u1",
      canShare: true,
      isLoggedIn: true,
      copied: true,
      shareOwnership: shareOwnershipMock,
      copyOwnership: copyOwnershipMock,
    });
    render(<OwnershipCard {...props} />);
    expect(screen.getByTestId("estate-ownership-share")).toHaveTextContent("Copied!");
  });

  it("renders nothing without real ownership", () => {
    const { container } = render(<OwnershipCard {...props} ownedShares={0} />);
    expect(container).toBeEmptyDOMElement();
    const { container: neg } = render(<OwnershipCard {...props} ownedShares={-3} />);
    expect(neg).toBeEmptyDOMElement();
  });

  it("shows an active sign-in entry (never a disabled button) when anonymous", () => {
    useShareOwnershipMock.mockReturnValue({
      shareLink: null,
      canShare: false,
      isLoggedIn: false,
      copied: false,
      shareOwnership: shareOwnershipMock,
      copyOwnership: copyOwnershipMock,
    });
    render(<OwnershipCard {...props} />);
    const cta = screen.getByTestId("estate-ownership-share");
    expect(cta).toHaveTextContent(/sign in/i);
    expect(cta).not.toBeDisabled();
    expect(cta).toHaveAttribute("href", "/recovery-login");
    expect(screen.queryByTestId("estate-ownership-copy")).not.toBeInTheDocument();
  });
});
