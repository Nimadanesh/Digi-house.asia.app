// File responsibility: Fifi Live Data boundary + provider contracts (FIFI-08).
// Answers "where can Fifi safely obtain current product/user state?" — never HOW
// to explain it (answer layer, later). Static KB and live state stay separate:
// KnowledgeRetriever → meaning; LiveDataProvider → current values.
//
// Design notes (from the FIFI-08 repository audit):
// - This checkout has NO API routes, NO server actions, NO DB clients. All data
//   flows through the existing `Repos` interfaces (src/lib/api/repos.ts), served
//   by mock or http implementations behind getRepo(). This layer therefore builds
//   ON those interfaces (dependency inversion) instead of inventing a backend.
// - Identity: the backend derives the caller from the session JWT (`sub`), the
//   frontend never sends a userId. This contract mirrors that: the request carries
//   NO user identity field; the subject is bound server-side at construction.
//   Wallet addresses are client-asserted (known GAP-01) and must NEVER authorize.
// - Mock firewall: demo sources are usable ONLY through an explicitly labeled
//   `mock-demo` provider that refuses unless constructed with `allowDemo: true`.
//   Mock values are never presented as production truth.

import type { Repos } from "@/lib/api/repos";
import type { Listing } from "@/types/property";
import type { OrderBookState } from "@/types/order";
import type { EarningsSummary } from "@/types/earnings";
import type { PortfolioSummary } from "@/types/position";

/** Stable capability IDs. Brand-neutral; renames never touch these. */
export type LiveCapability =
  | "portfolio.summary"
  | "portfolio.holdings"
  | "earnings.current"
  | "earnings.history"
  | "withdrawal.status"
  | "transaction.status"
  | "order.status"
  | "membership.status"
  | "referral.status"
  | "estate.current";

/** Availability of a capability in the wired environment. */
export type CapabilityStatus =
  | "AVAILABLE_NOW"
  | "AVAILABLE_WITH_EXISTING_BACKEND"
  | "NOT_IMPLEMENTED"
  | "REQUIRES_EXTERNAL_SOURCE"
  | "UNKNOWN";

/** Where the returned values actually came from. Never implied — always labeled. */
export type DataSource = "live" | "mock-demo" | "unavailable";

/** Provenance compatible with the Knowledge Foundation (never auto-upgraded). */
export type LiveProvenance = "OBSERVED" | "DERIVED" | "ESTIMATED" | "PROJECTED" | "UNKNOWN" | "CONFLICTED";

/** Currentness of the returned values. */
export type Currentness = "current" | "historical" | "projected" | "unknown";

/** Subject bound server-side at provider construction. No client override exists. */
export interface LiveSubject {
  kind: "authenticated-user" | "anonymous";
  /** Server-resolved user id (JWT `sub`). Absent for anonymous. */
  userId?: string;
}

/** Typed live-data request. Minimum necessary context — no tokens, keys, or URLs. */
export interface LiveDataRequest {
  capability: LiveCapability;
  /** Canonical property id (`re-*`) for property-scoped capabilities. */
  propertyId?: string;
  /** Bounded field selection hint for future providers. Ignored if unsupported. */
  fields?: string[];
  locale?: string;
  /** Opaque correlation id passthrough. Generated server-side, never trusted. */
  requestId?: string;
}

/** Structured failure. No user-facing prose generated here. */
export type LiveDataErrorCode =
  | "unauthenticated"
  | "unauthorized"
  | "unavailable"
  | "not_implemented"
  | "source_error"
  | "stale"
  | "invalid_context"
  | "insufficient_context"
  | "unknown";

export interface LiveDataError {
  ok: false;
  capability: LiveCapability;
  code: LiveDataErrorCode;
  /** Safe machine-readable detail. Never secrets, payloads, or stack traces. */
  detail?: string;
}

/** Structured success. Repo-native data + explicit truth metadata. */
export interface LiveDataSuccess<T> {
  ok: true;
  capability: LiveCapability;
  /** Echo of the bound subject (proves routing; never a second identity). */
  subject: { kind: LiveSubject["kind"]; scoped: boolean };
  data: T;
  provenance: LiveProvenance;
  currentness: Currentness;
  source: DataSource;
  /** Freshness actually provided by the source; `unknown` unless stated. */
  freshness: "current" | "stale" | "unknown";
}

export type LiveDataResponse<T> = LiveDataSuccess<T> | LiveDataError;

/** Capability metadata registry entry. */
export interface CapabilityMeta {
  id: LiveCapability;
  requiresUser: boolean;
  requiresProperty: boolean;
  status: CapabilityStatus;
  userSpecific: boolean;
  source: string;
  provenance: LiveProvenance;
  currentness: Currentness;
}

/** Central registry. Only registered capabilities are callable. */
export const LIVE_CAPABILITY_REGISTRY: Readonly<Record<LiveCapability, CapabilityMeta>> = {
  "portfolio.summary": {
    id: "portfolio.summary",
    requiresUser: true,
    requiresProperty: false,
    status: "AVAILABLE_WITH_EXISTING_BACKEND",
    userSpecific: true,
    source: "PortfolioRepo.summary()",
    provenance: "DERIVED",
    currentness: "current",
  },
  "portfolio.holdings": {
    id: "portfolio.holdings",
    requiresUser: true,
    requiresProperty: false,
    status: "AVAILABLE_WITH_EXISTING_BACKEND",
    userSpecific: true,
    source: "PortfolioRepo.summary() holdings",
    provenance: "DERIVED",
    currentness: "current",
  },
  "earnings.current": {
    id: "earnings.current",
    requiresUser: true,
    requiresProperty: false,
    status: "AVAILABLE_WITH_EXISTING_BACKEND",
    userSpecific: true,
    source: "EarningsRepo.summary() accrued/expected",
    provenance: "DERIVED",
    currentness: "current",
  },
  "earnings.history": {
    id: "earnings.history",
    requiresUser: true,
    requiresProperty: false,
    status: "AVAILABLE_WITH_EXISTING_BACKEND",
    userSpecific: true,
    source: "EarningsRepo.summary() entries",
    provenance: "OBSERVED",
    currentness: "historical",
  },
  "withdrawal.status": {
    id: "withdrawal.status",
    requiresUser: true,
    requiresProperty: false,
    status: "AVAILABLE_WITH_EXISTING_BACKEND",
    userSpecific: true,
    source: "WithdrawalsRepo.list()",
    provenance: "OBSERVED",
    currentness: "current",
  },
  "transaction.status": {
    id: "transaction.status",
    requiresUser: true,
    requiresProperty: false,
    status: "AVAILABLE_WITH_EXISTING_BACKEND",
    userSpecific: true,
    source: "TxRepo.listTransactions()",
    provenance: "OBSERVED",
    currentness: "historical",
  },
  "order.status": {
    id: "order.status",
    requiresUser: true,
    requiresProperty: true,
    status: "AVAILABLE_WITH_EXISTING_BACKEND",
    userSpecific: true,
    source: "OrderBookRepo.get() bids/asks",
    provenance: "OBSERVED",
    currentness: "current",
  },
  "membership.status": {
    id: "membership.status",
    requiresUser: true,
    requiresProperty: false,
    status: "NOT_IMPLEMENTED",
    userSpecific: true,
    source: "prototype thresholds only — no repo",
    provenance: "UNKNOWN",
    currentness: "unknown",
  },
  "referral.status": {
    id: "referral.status",
    requiresUser: true,
    requiresProperty: false,
    status: "NOT_IMPLEMENTED",
    userSpecific: true,
    source: "prototype model only — no ledger",
    provenance: "UNKNOWN",
    currentness: "unknown",
  },
  "estate.current": {
    id: "estate.current",
    requiresUser: false,
    requiresProperty: true,
    status: "AVAILABLE_WITH_EXISTING_BACKEND",
    userSpecific: false,
    source: "MarketplaceRepo.get() price/availability",
    provenance: "DERIVED",
    currentness: "current",
  },
};

/** Provider-independent live-data contract. */
export interface LiveDataProvider {
  readonly providerName: string;
  /** Declared source label. `mock-demo` values are demo truth only. */
  readonly source: DataSource;
  fetch(request: LiveDataRequest): Promise<LiveDataResponse<unknown>>;
}

interface ProviderOptions {
  subject: LiveSubject;
  /** Demo sources require explicit opt-in — otherwise every call fails closed. */
  allowDemo?: boolean;
}

function requireUser(meta: CapabilityMeta, subject: LiveSubject): LiveDataError | null {
  if (!meta.requiresUser) return null;
  if (subject.kind !== "authenticated-user" || !subject.userId) {
    return {
      ok: false,
      capability: meta.id,
      code: subject.kind === "anonymous" ? "unauthenticated" : "unauthorized",
    };
  }
  return null;
}

/**
 * Repository-backed provider. Wraps the existing `Repos` interfaces so mock and
 * http implementations are interchangeable without touching this layer. The
 * caller declares (and owns) the truthfulness of `source`: pass `live` only when
 * wired to the authenticated backend; `mock-demo` requires `allowDemo: true`.
 */
export class RepoLiveDataProvider implements LiveDataProvider {
  readonly providerName = "repo-live-data-v1";
  readonly source: DataSource;
  private readonly repos: Repos;
  private readonly subject: LiveSubject;

  constructor(repos: Repos, source: DataSource, options: ProviderOptions) {
    if (source === "mock-demo" && options.allowDemo !== true) {
      throw new Error("mock-demo source requires explicit allowDemo opt-in");
    }
    if (source === "unavailable") throw new Error("unavailable source cannot serve");
    this.repos = repos;
    this.source = source;
    this.subject = options.subject;
  }

  async fetch(request: LiveDataRequest): Promise<LiveDataResponse<unknown>> {
    const meta = LIVE_CAPABILITY_REGISTRY[request.capability];
    if (!meta) {
      return { ok: false, capability: request.capability, code: "not_implemented" };
    }
    if (meta.status === "NOT_IMPLEMENTED") {
      return { ok: false, capability: request.capability, code: "not_implemented" };
    }
    const authError = requireUser(meta, this.subject);
    if (authError) return authError;
    if (meta.requiresProperty && !request.propertyId) {
      return { ok: false, capability: request.capability, code: "insufficient_context" };
    }
    try {
      const data = await this.readCapability(request);
      return {
        ok: true,
        capability: request.capability,
        subject: { kind: this.subject.kind, scoped: this.subject.kind === "authenticated-user" },
        data,
        provenance: meta.provenance,
        currentness: meta.currentness,
        source: this.source,
        freshness: "unknown",
      };
    } catch {
      return { ok: false, capability: request.capability, code: "source_error" };
    }
  }

  private async readCapability(request: LiveDataRequest): Promise<unknown> {
    switch (request.capability) {
      case "portfolio.summary": {
        const summary: PortfolioSummary = await this.repos.portfolio.summary();
        return summary;
      }
      case "portfolio.holdings": {
        const summary: PortfolioSummary = await this.repos.portfolio.summary();
        return summary.holdings;
      }
      case "earnings.current": {
        const summary: EarningsSummary = await this.repos.earnings.summary();
        // Native field names preserved verbatim so projected vs paid can never
        // be confused: `*Projected*` keys are projections, `allTimeUsd` is the
        // received total, `lockYield` carries locked-share accrual when present.
        return {
          allTimeUsd: summary.allTimeUsd,
          thisWeekProjectedUsd: summary.thisWeekProjectedUsd,
          projectedNextWeekUsd: summary.projectedNextWeekUsd,
          lockYield: summary.yield ?? null,
        };
      }
      case "earnings.history": {
        const summary: EarningsSummary = await this.repos.earnings.summary();
        return summary.entries;
      }
      case "withdrawal.status": {
        return this.repos.withdrawals.list();
      }
      case "transaction.status": {
        const page = await this.repos.tx.listTransactions({ limit: 20 });
        return page.transactions;
      }
      case "order.status": {
        const book: OrderBookState = await this.repos.orderBook.get(request.propertyId as string);
        return { bids: book.bids, asks: book.asks };
      }
      case "estate.current": {
        const listing: Listing = await this.repos.marketplace.get(request.propertyId as string);
        return {
          propertyId: listing.id,
          sharePrice: listing.sharePriceUsd,
          sold: listing.sharesSold,
          total: listing.totalShares,
          status: listing.status,
        };
      }
      case "membership.status":
      case "referral.status":
        throw new Error("not_implemented");
      default:
        throw new Error("not_implemented");
    }
  }
}

