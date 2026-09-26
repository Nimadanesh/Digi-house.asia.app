import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const { shareCoOwnMock, copyCoOwnMock } = vi.hoisted(() => ({
  shareCoOwnMock: vi.fn(),
  copyCoOwnMock: vi.fn(),
}));

const useCoOwnInviteMock = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/useCoOwnInvite", () => ({
  useCoOwnInvite: (...args: unknown[]) => useCoOwnInviteMock(...args),
}));

import { CoOwnEstateCard } from "@/components/circle/CoOwnEstateCard";

describe("CoOwnEstateCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCoOwnInviteMock.mockReturnValue({
      coOwnLink: "https://t.me/Bot?startapp=coown_re-1_ref_u1",
      canShare: true,
      isLoggedIn: true,
      copied: false,
      shareCoOwn: shareCoOwnMock,
      copyCoOwn: copyCoOwnMock,
    });
  });

  it("renders the estate co-own invite with share + copy actions", () => {
    render(<CoOwnEstateCard estateId="re-1" estateTitle="Test Villa" />);
    expect(screen.getByTestId("estate-coown")).toBeInTheDocument();
    expect(screen.getByTestId("estate-coown-share")).toHaveTextContent("Invite to Co-Own");
    expect(useCoOwnInviteMock).toHaveBeenCalledWith("re-1");
    fireEvent.click(screen.getByTestId("estate-coown-share"));
    expect(shareCoOwnMock).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId("estate-coown-copy"));
    expect(copyCoOwnMock).toHaveBeenCalledTimes(1);
  });

  it("shows copied feedback after a successful copy", () => {
    useCoOwnInviteMock.mockReturnValue({
      coOwnLink: "https://t.me/Bot?startapp=coown_re-1_ref_u1",
      canShare: true,
      isLoggedIn: true,
      copied: true,
      shareCoOwn: shareCoOwnMock,
      copyCoOwn: copyCoOwnMock,
    });
    render(<CoOwnEstateCard estateId="re-1" estateTitle="Test Villa" />);
    expect(screen.getByTestId("estate-coown-share")).toHaveTextContent("Copied!");
  });

  it("shows an active sign-in entry (never a disabled button) when anonymous", () => {
    useCoOwnInviteMock.mockReturnValue({
      coOwnLink: null,
      canShare: false,
      isLoggedIn: false,
      copied: false,
      shareCoOwn: shareCoOwnMock,
      copyCoOwn: copyCoOwnMock,
    });
    render(<CoOwnEstateCard estateId="re-1" estateTitle="Test Villa" />);
    const cta = screen.getByTestId("estate-coown-share");
    expect(cta).toHaveTextContent(/sign in/i);
    expect(cta).not.toBeDisabled();
    expect(cta).toHaveAttribute("href", "/recovery-login");
    expect(screen.queryByTestId("estate-coown-copy")).not.toBeInTheDocument();
  });
});
