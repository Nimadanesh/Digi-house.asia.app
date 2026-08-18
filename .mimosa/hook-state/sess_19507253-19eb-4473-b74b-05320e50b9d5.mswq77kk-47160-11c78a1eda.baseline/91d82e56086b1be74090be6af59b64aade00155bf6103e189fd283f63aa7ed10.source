// File responsibility: TonAPI.io HTTP implementation of TonTxClient.
//   GET {base}/v2/blockchain/messages/{msgHash}/transaction → Transaction produced by that message
//   GET {base}/v2/events/{hash} → high-level trace event containing a JettonTransfer action
//   GET {base}/v2/blockchain/accounts/{master}/methods/get_wallet_address → owner's jetton wallet
// (https://docs.tonapi.io/tonapi/rest-api/blockchain#getblockchaintransactionbymessagehash).
// Returns "not_found" on 404 (message not indexed yet) and "error" on transport/5xx (retryable).
import type {
  JettonTransferLookupResult,
  JettonWalletLookupResult,
  OnChainJettonTransfer,
  OnChainTx,
  OutMessage,
  TonTxClient,
  TxLookupResult,
} from "./tx-client.js";

const TIMEOUT_MS = 8000;

type RawJettonTransferAction = {
  type?: string;
  status?: string;
  jetton?: { address?: string } | null;
  /** Senders (the jetton wallet contract that initiated the transfer). */
  senders?: Array<{ address?: string }> | null;
  recipient?: { address?: string } | null;
  amount?: string;
};

type RawEvent = {
  timestamp?: number;
  actions?: RawJettonTransferAction[];
};

type RawMessage = {
  destination?: { address?: string } | null;
  value?: string;
};

type RawTransaction = {
  hash?: string;
  account?: { address?: string } | null;
  success?: boolean;
  utime?: number;
  out_msgs?: RawMessage[];
};

function mapOutMessage(m: RawMessage): OutMessage {
  return {
    destinationAddress: m.destination?.address,
    valueNano: m.value,
  };
}

function mapTransaction(raw: RawTransaction): OnChainTx | null {
  if (!raw.hash || typeof raw.success !== "boolean" || typeof raw.utime !== "number") {
    return null;
  }
  return {
    hash: raw.hash,
    success: raw.success,
    utime: raw.utime,
    ...(raw.account?.address ? { accountAddress: raw.account.address } : {}),
    outMessages: Array.isArray(raw.out_msgs) ? raw.out_msgs.map(mapOutMessage) : [],
  };
}

export function createTonApiTxClient(opts: {
  baseUrl: string;
  apiKey?: string;
  fetchImpl?: typeof fetch;
}): TonTxClient {
  const base = opts.baseUrl.replace(/\/+$/, "");
  const doFetch = opts.fetchImpl ?? globalThis.fetch;

  return {
    async getTransactionByMessageHash(hash): Promise<TxLookupResult> {
      let res: Response;
      try {
        res = await doFetch(
          `${base}/v2/blockchain/messages/${encodeURIComponent(hash)}/transaction`,
          {
            headers: {
              accept: "application/json",
              ...(opts.apiKey ? { authorization: `Bearer ${opts.apiKey}` } : {}),
            },
            signal: AbortSignal.timeout(TIMEOUT_MS),
          },
        );
      } catch {
        return { kind: "error" };
      }
      if (res.status === 404) return { kind: "not_found" };
      if (!res.ok) return { kind: "error" };
      let json: unknown;
      try {
        json = await res.json();
      } catch {
        return { kind: "error" };
      }
      const tx = mapTransaction((json ?? {}) as RawTransaction);
      return tx ? { kind: "found", tx } : { kind: "error" };
    },

    async getJettonTransfer(hash): Promise<JettonTransferLookupResult> {
      let res: Response;
      try {
        res = await doFetch(
          `${base}/v2/events/${encodeURIComponent(hash)}`,
          {
            headers: {
              accept: "application/json",
              ...(opts.apiKey ? { authorization: `Bearer ${opts.apiKey}` } : {}),
            },
            signal: AbortSignal.timeout(TIMEOUT_MS),
          },
        );
      } catch {
        return { kind: "error" };
      }
      if (res.status === 404) return { kind: "not_found" };
      if (!res.ok) return { kind: "error" };
      let json: unknown;
      try {
        json = await res.json();
      } catch {
        return { kind: "error" };
      }
      const event = (json ?? {}) as RawEvent;
      const action = (event.actions ?? []).find((a) => a.type === "JettonTransfer");
      if (!action) return { kind: "not_found" };
      const transfer: OnChainJettonTransfer = {
        status: action.status === "failed" ? "failed" : "ok",
        jettonMasterAddress: action.jetton?.address,
        ...(action.senders?.[0]?.address
          ? { senderWalletAddress: action.senders[0].address }
          : {}),
        recipientAddress: action.recipient?.address,
        amount: action.amount ?? "0",
        utime: event.timestamp ?? 0,
      };
      return { kind: "found", transfer };
    },

    async getJettonWalletAddress(masterAddress, ownerAddress): Promise<JettonWalletLookupResult> {
      let res: Response;
      try {
        const url = new URL(
          `${base}/v2/blockchain/accounts/${encodeURIComponent(masterAddress)}/methods/get_wallet_address`,
        );
        url.searchParams.set("args", JSON.stringify([ownerAddress]));
        res = await doFetch(url.toString(), {
          headers: {
            accept: "application/json",
            ...(opts.apiKey ? { authorization: `Bearer ${opts.apiKey}` } : {}),
          },
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
      } catch {
        return { kind: "error" };
      }
      if (!res.ok) return { kind: "error" };
      let json: unknown;
      try {
        json = await res.json();
      } catch {
        return { kind: "error" };
      }
      const stack = ((json ?? {}) as { stack?: Array<{ type?: string; value?: string }> }).stack ?? [];
      const addr = stack.find((item) => item.type === "addr" && item.value);
      return addr?.value ? { kind: "found", address: addr.value } : { kind: "error" };
    },
  };
}
