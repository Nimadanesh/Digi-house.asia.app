export type TonApiJettonTransfer = {
  event_id: string;
  tx_hash: string;
  block_lt: string;
  logical_time?: string;
  from: string;
  to: string;
  amount: string;
  jetton_master: string;
};

export type TonApiDistributionClaim = {
  event_id: string;
  tx_hash: string;
  block_lt: string;
  logical_time?: string;
  claimer: string;
  property_id: string;
  week_of: string;
  amount_nano: string;
};

export type TonApiEvent =
  | { type: "jetton_transfer"; data: TonApiJettonTransfer }
  | { type: "distribution_claim"; data: TonApiDistributionClaim }
  | { type: "distribution_funded"; data: { event_id: string; tx_hash: string; block_lt: string; logical_time?: string; funder: string; amount: string } }
  | { type: "unknown"; data: { event_id: string; tx_hash: string; block_lt: string; logical_time?: string; raw: Record<string, unknown> } };

export type TonClientConfig = {
  baseUrl: string;
  apiKey?: string;
};

export type TonClient = {
  fetchJettonTransfers(
    masterAddress: string,
    cursor?: number,
    limit?: number,
  ): Promise<{ events: TonApiJettonTransfer[]; nextCursor: number | null }>;
  fetchDistributionClaims(
    distributionAddress: string,
    cursor?: number,
    limit?: number,
  ): Promise<{ events: TonApiDistributionClaim[]; nextCursor: number | null }>;
  healthCheck(): Promise<boolean>;
};

export function createTonClient(config: TonClientConfig): TonClient {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (config.apiKey) {
    headers["X-API-Key"] = config.apiKey;
    headers["Authorization"] = `Bearer ${config.apiKey}`;
  }

  async function fetchJson<T>(
    path: string,
    params?: Record<string, string>,
  ): Promise<T> {
    const url = new URL(path, config.baseUrl);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, v);
      }
    }
    const res = await fetch(url.toString(), { headers });
    if (!res.ok) {
      throw new Error(`TonAPI ${res.status}: ${await res.text().catch(() => "no body")}`);
    }
    return res.json() as Promise<T>;
  }

  return {
    async fetchJettonTransfers(masterAddress, cursor, limit = 50) {
      const params: Record<string, string> = {
        jetton_master: masterAddress,
        limit: String(limit),
      };
      if (cursor && cursor > 0) {
        params.cursor = String(cursor);
      }
      const body = await fetchJson<{
        events: TonApiJettonTransfer[];
        next_cursor?: number;
      }>("/v1/jetton/transfers", params);
      return {
        events: body.events ?? [],
        nextCursor: body.next_cursor ?? null,
      };
    },

    async fetchDistributionClaims(distributionAddress, cursor, limit = 50) {
      const params: Record<string, string> = {
        contract: distributionAddress,
        limit: String(limit),
      };
      if (cursor && cursor > 0) {
        params.cursor = String(cursor);
      }
      const body = await fetchJson<{
        events: TonApiDistributionClaim[];
        next_cursor?: number;
      }>("/v1/contracts/events", params);
      return {
        events: body.events ?? [],
        nextCursor: body.next_cursor ?? null,
      };
    },

    async healthCheck() {
      try {
        await fetchJson<unknown>("/v1/health", {});
        return true;
      } catch {
        return false;
      }
    },
  };
}

export function createStubTonClient(): TonClient {
  return {
    async fetchJettonTransfers() {
      return { events: [], nextCursor: null };
    },
    async fetchDistributionClaims() {
      return { events: [], nextCursor: null };
    },
    async healthCheck() {
      return true;
    },
  };
}
