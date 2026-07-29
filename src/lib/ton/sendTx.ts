// File responsibility: build a TonConnect sendTransaction request and submit it via the wallet UI service.
// MVP honesty: the returned txHash is a SYNTHETIC PLACEHOLDER; on-chain share minting is post-MVP.
// Hard boundary: components call useTonConnect().send() — never import this file from components.
import type { TonConnectUI } from "@tonconnect/ui";
import {
  CHAIN,
  type SendTransactionRequest,
  type SendTransactionRequestWithMessages,
} from "@tonconnect/sdk";
import type { BuyMessageInput, SendTxResult } from "@/types/ton";
import { env } from "@/lib/env";
import { makeSyntheticTxHash } from "@/lib/ton/synthetic-tx";

export { makeSyntheticTxHash } from "@/lib/ton/synthetic-tx";

/** Build a TonConnect SendTransactionRequest for a single outbound value message. */
export function buildBuyMessage(input: BuyMessageInput): SendTransactionRequestWithMessages {
  const { toFriendlyAddress, nanoTon, memo, validUntilSeconds = 300 } = input;
  return {
    validUntil: Math.floor(Date.now() / 1000) + validUntilSeconds,
    network: env.network === "mainnet" ? CHAIN.MAINNET : CHAIN.TESTNET,
    messages: [
      {
        address: toFriendlyAddress,
        amount: BigInt(nanoTon).toString(),
        ...(memo ? { payload: memoToBase64(memo) } : {}),
      },
    ],
  };
}

// TonConnect expects the payload as a one-cell BoC base64. The MVP buy stub attaches the memo as a
// plain UTF8 comment body for wallet display; a real comment-cell builder (with the 32-bit comment
// magic + op-code) lands with the post-MVP Distribution contract in src/lib/ton/contracts/.
function memoToBase64(text: string): string {
  if (typeof btoa === "undefined") return text;
  return btoa(unescape(encodeURIComponent(text)));
}

/** Submit a request through the connected wallet. Returns a SendTxResult with a synthetic txHash. */
export async function sendTx(
  ui: TonConnectUI | null,
  request: SendTransactionRequest,
): Promise<SendTxResult> {
  if (!ui) {
    return { ok: false, txHash: "", error: "no wallet/ui available" };
  }
  try {
    const res = (await ui.sendTransaction(request, {
      traceId: `digihouse-${Date.now()}`,
    })) as { boc?: string } | undefined;
    if (!res?.boc) {
      return {
        ok: false,
        txHash: makeSyntheticTxHash(),
        error: "wallet returned no boc",
      };
    }
    return { ok: true, boc: res.boc, txHash: makeSyntheticTxHash() };
  } catch (e) {
    const error = e instanceof Error ? e.message : "wallet rejected transaction";
    return { ok: false, txHash: "", error };
  }
}