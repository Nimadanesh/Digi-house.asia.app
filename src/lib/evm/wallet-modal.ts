// File responsibility: lazy singleton for the WalletConnect v2 standalone modal.
// Client-only (never constructed during SSR); no-ops without a Project ID so the
// app builds and runs before https://cloud.walletconnect.com setup is done.
import { env } from "@/lib/env";

type ModalInstance = {
  openModal: (opts: { uri: string }) => Promise<void>;
  closeModal: () => void;
};

let modal: ModalInstance | null = null;
let initFailed = false;

async function getModal(): Promise<ModalInstance | null> {
  if (typeof window === "undefined" || initFailed) return null;
  if (modal) return modal;
  const projectId = env.walletConnectProjectId;
  if (!projectId) return null;
  try {
    const { WalletConnectModal } = await import("@walletconnect/modal");
    modal = new WalletConnectModal({
      projectId,
      themeMode: "dark",
    }) as unknown as ModalInstance;
    return modal;
  } catch {
    initFailed = true;
    return null;
  }
}

export async function openWalletConnectModal(uri: string): Promise<boolean> {
  const m = await getModal();
  if (!m) return false;
  try {
    await m.openModal({ uri });
    return true;
  } catch {
    return false;
  }
}

export async function closeWalletConnectModal(): Promise<void> {
  if (!modal) return;
  try {
    modal.closeModal();
  } catch {
    /* ignore */
  }
}
