import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useUiStore } from "@/stores/ui.store";

vi.mock("next/image", () => ({
  default: (props: { alt: string }) => <span data-testid="img">{props.alt}</span>,
}));
vi.mock("@/hooks/useTelegramUser", () => ({
  useTelegramUser: () => ({ firstName: "Demo", photoUrl: undefined, isDemo: true }),
}));
vi.mock("@/hooks/useTonConnect", () => ({
  useTonConnect: () => ({
    connected: false,
    openModal: vi.fn(),
  }),
}));
vi.mock("@/hooks/useTelegram", () => ({
  useTelegram: () => ({
    haptics: { selection: vi.fn(), impact: vi.fn(), notification: vi.fn() },
  }),
}));

import { GlobalHeader } from "@/components/layout/GlobalHeader";

describe("GlobalHeader → Settings open", () => {
  beforeEach(() => {
    useUiStore.setState({ settingsOpen: false });
  });

  it("settings button calls openSettings", () => {
    render(<GlobalHeader />);
    fireEvent.click(screen.getByTestId("global-settings-btn"));
    expect(useUiStore.getState().settingsOpen).toBe(true);
  });
});
