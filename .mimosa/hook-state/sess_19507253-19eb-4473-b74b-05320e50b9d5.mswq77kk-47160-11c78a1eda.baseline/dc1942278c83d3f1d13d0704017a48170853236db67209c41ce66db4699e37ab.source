// File responsibility: build a TonConnect sendTransaction request and submit it via the wallet UI service.
// Step 2: on the PAYMENT path the returned txHash is derived from the wallet's signed boc (Cell hash),
// not a "simulated:" placeholder — the wallet confirms the transaction. On-chain settlement/verification
// of that hash is post-MVP.
// Hard boundary: components call useTonConnect().send() — never import this file from components.
import type { TonConnectUI } from "@tonconnect/ui";
import { Cell } from "@ton/core";
import {
  CHAIN,
  type SendTransactionRequest,
  type SendTransactionRequestWithMessages,
} from "@tonconnect/sdk";
import type { BuyMessageInput, SendTxResult } from "@/types/ton";
import { env } from "@/lib/env";

/** Build a TonConnect SendTransactionRequest for a single outbound message. */
export function buildBuyMessage(input: BuyMessageInput): SendTransactionRequestWithMessages {
  const { toFriendlyAddress, nanoTon, memo, validUntilSeconds = 300 } = input;
  // A pre-built body (USDT jetton_transfer) wins over the memo comment; the wallet sends it verbatim.
  const payload = input.payload ?? (memo ? memoToBase64(memo) : undefined);
  return {
    validUntil: Math.floor(Date.now() / 1000) + validUntilSeconds,
    network: env.network === "mainnet" ? CHAIN.MAINNET : CHAIN.TESTNET,
    messages: [
      {
        address: toFriendlyAddress,
        amount: BigInt(nanoTon).toString(),
        ...(payload ? { payload } : {}),
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

/**
 * Derive a transaction hash from the wallet-signed boc (message Cell hash, hex).
 * This is the REAL hash of the signed external message the user approved.
 */
function hashOfBoc(boc: string): string {
  return Cell.fromBase64(boc).hash().toString("hex");
}

/** Submit a request through the connected wallet. Returns a SendTxResult with the real txHash. */
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
        txHash: "",
        error: "wallet returned no boc",
      };
    }
    return { ok: true, boc: res.boc, txHash: hashOfBoc(res.boc) };
  } catch (e) {
    const error = e instanceof Error ? e.message : "wallet rejected transaction";
    return { ok: false, txHash: "", error };
  }
}