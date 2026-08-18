import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { useUiStore } from "@/stores/ui.store";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
}));

import SettingsPage from "@/app/(app)/settings/page";

describe("Settings page — deep link", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUiStore.setState({ settingsOpen: false });
  });

  it("opens the settings sheet flag and replaces to home", async () => {
    render(<SettingsPage />);
    await waitFor(() => {
      expect(useUiStore.getState().settingsOpen).toBe(true);
      expect(replace).toHaveBeenCalledWith("/home");
    });
  });
});
