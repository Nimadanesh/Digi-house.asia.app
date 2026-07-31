# Transaction History Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** User can view their transaction ledger (buy/sell/earnings/withdraw) with honesty-correct hashes.

**Architecture:** New `listByUserId` on existing TxStore + join with properties for enrichment. New route `GET /v1/transactions` behind `requireSession`. Mini App adds hook, two components (row + list), route page, and settings link.

**Tech Stack:** Hono, Drizzle ORM, Postgres, Vitest, TanStack Query, shadcn/ui, Lucide.

## Global Constraints

- All API routes follow existing patterns (route factory, typed deps, `c.req.param()`, `c.json()`)
- Auth uses `requireSession` middleware (Bearer JWT) — IDOR-safe via server-side `userId` filter
- Money values in integer cents; TON in nanoTON
- No `any` types; strict TypeScript
- Component imports no `lib/ton`, `lib/mock`, raw `fetch` to R2
- Simulated hashes labeled; real hashes get explorer when `canShowExplorerLink` is true
- Pagination: offset-based, default limit 50, max 100

---

### Task 1: Extend Transaction types + TxStore with listByUserId

**Files:**
- Modify: `apps/api/src/buys/tx-store.ts`
- Modify: `src/types/transaction.ts`

**Interfaces:**
- Produces: `TransactionRecord` gains optional `propertyTitle`/`propertyImage`; `TransactionPublic` gains same; `TxStore` gains `listByUserId` method

- [ ] **Step 1: Extend Mini App Transaction type**

In `src/types/transaction.ts`, add optional property enrichment fields:

```ts
export interface Transaction {
  id: string;
  kind: TxKind;
  propertyId?: string;
  userId: string;
  shares?: number;
  amountUsd: number;
  tonAmount?: number;
  status: TxStatus;
  txHash?: string;
  error?: string;
  createdAt: string;
  propertyTitle?: string;
  propertyImage?: string;
}
```

- [ ] **Step 2: Extend API TransactionRecord**

In `apps/api/src/buys/tx-store.ts`, add fields to `TransactionRecord`:

```ts
export type TransactionRecord = {
  id: string;
  userId: string;
  kind: TxKind;
  propertyId: string | null;
  shares: number | null;
  amountUsd: number;
  tonAmount: number | null;
  status: TxStatus;
  txHash: string | null;
  error: string | null;
  buyIntentId: string | null;
  createdAt: Date;
  propertyTitle?: string;
  propertyImage?: string;
};
```

- [ ] **Step 3: Extend API TransactionPublic**

Add same fields to `TransactionPublic`:

```ts
export type TransactionPublic = {
  id: string;
  kind: TxKind;
  propertyId?: string;
  userId: string;
  shares?: number;
  amountUsd: number;
  tonAmount?: number;
  status: TxStatus;
  txHash?: string;
  error?: string;
  createdAt: string;
  propertyTitle?: string;
  propertyImage?: string;
};
```

- [ ] **Step 4: Add listByUserId to TxStore interface**

```ts
export type TxStore = {
  insert(input: { ... }): Promise<TransactionRecord>;
  listByUserId(userId: string, opts?: { limit?: number; offset?: number }): Promise<TransactionRecord[]>;
};
```

- [ ] **Step 5: Extend mapTransactionPublic to pass through property fields**

```ts
export function mapTransactionPublic(r: TransactionRecord): TransactionPublic {
  const out: TransactionPublic = {
    id: r.id,
    kind: r.kind,
    userId: r.userId,
    amountUsd: r.amountUsd,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  };
  if (r.propertyId) out.propertyId = r.propertyId;
  if (r.shares != null) out.shares = r.shares;
  if (r.tonAmount != null) out.tonAmount = r.tonAmount;
  if (r.txHash) out.txHash = r.txHash;
  if (r.error) out.error = r.error;
  if (r.propertyTitle) out.propertyTitle = r.propertyTitle;
  if (r.propertyImage) out.propertyImage = r.propertyImage;
  return out;
}
```

- [ ] **Step 6: Implement listByUserId in createDbTxStore**

```ts
async listByUserId(userId, opts = {}) {
  const limit = Math.min(opts.limit ?? 50, 100);
  const offset = opts.offset ?? 0;
  const rows = await db
    .select({
      id: transactions.id,
      userId: transactions.userId,
      kind: transactions.kind,
      propertyId: transactions.propertyId,
      shares: transactions.shares,
      amountUsd: transactions.amountUsd,
      tonAmount: transactions.tonAmount,
      status: transactions.status,
      txHash: transactions.txHash,
      error: transactions.error,
      buyIntentId: transactions.buyIntentId,
      createdAt: transactions.createdAt,
      propertyTitle: properties.title,
      propertyImage: sql<string>`${properties.images}->>0`,
    })
    .from(transactions)
    .leftJoin(properties, eq(transactions.propertyId, properties.id))
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.createdAt))
    .limit(limit)
    .offset(offset);
  return rows.map(mapRow);
},
```

Add imports at top:
```ts
import { desc, eq, sql } from "drizzle-orm";
import { properties } from "../db/schema/properties.js";
```

- [ ] **Step 7: Implement listByUserId in createMemoryTxStore**

```ts
async listByUserId(userId, opts = {}) {
  const limit = Math.min(opts.limit ?? 50, 100);
  const offset = opts.offset ?? 0;
  return rows
    .filter((r) => r.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(offset, offset + limit);
},
```

- [ ] **Step 8: Typecheck**

```bash
npm run typecheck -w @digihouse/api
npm run typecheck
```

Expected: pass.

- [ ] **Step 9: Commit**

```bash
git add apps/api/src/buys/tx-store.ts src/types/transaction.ts
git commit -m "feat(api,app): extend TxStore + Transaction types with listByUserId and property enrichment (P4-05)"
```

---

### Task 2: Create transactions route + wire into app

**Files:**
- Create: `apps/api/src/routes/transactions.ts`
- Modify: `apps/api/src/app.ts`

**Interfaces:**
- Consumes: `TxStore` with `listByUserId`, `SessionConfig`, `UserStore`
- Produces: `GET /v1/transactions` endpoint

- [ ] **Step 1: Create route file**

Create `apps/api/src/routes/transactions.ts`:

```ts
import { Hono } from "hono";
import { requireSession } from "../auth/require-session.js";
import type { SessionConfig } from "../auth/session.js";
import type { UserStore } from "../auth/user-store.js";
import type { TxStore } from "../buys/tx-store.js";
import { mapTransactionPublic } from "../buys/tx-store.js";

export type TransactionRouteDeps = {
  session: SessionConfig;
  users: UserStore;
  transactions: TxStore;
};

export function createTransactionRoutes(deps: TransactionRouteDeps) {
  const app = new Hono();

  app.get(
    "/v1/transactions",
    requireSession({ session: deps.session, users: deps.users }),
    async (c) => {
      const userId = c.get("userId");
      const rawLimit = c.req.query("limit");
      const rawOffset = c.req.query("offset");
      const limit = Math.min(Number(rawLimit) || 50, 100);
      const offset = Math.max(Number(rawOffset) || 0, 0);

      const rows = await deps.transactions.listByUserId(userId, { limit, offset });
      const transactions = rows.map(mapTransactionPublic);
      const hasMore = rows.length === limit;

      return c.json({ transactions, hasMore });
    },
  );

  return app;
}
```

- [ ] **Step 2: Wire into app.ts**

In `apps/api/src/app.ts`:

Add import:
```ts
import { createTransactionRoutes } from "./routes/transactions.js";
```

After the buys routes block, add:
```ts
  if (transactions && users) {
    app.route(
      "/",
      createTransactionRoutes({
        session,
        users: users!,
        transactions,
      }),
    );
  }
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck -w @digihouse/api
```
Expected: pass.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/routes/transactions.ts apps/api/src/app.ts
git commit -m "feat(api): transaction list endpoint with property enrichment (P4-05)"
```

---

### Task 3: Extend Mini App repos with listTransactions

**Files:**
- Modify: `src/lib/api/repos.ts`
- Modify: `src/lib/api/http/http-repos.ts`
- Modify: `src/lib/mock/transaction.ts`
- Modify: `src/lib/mock/seed/transactions.ts`

- [ ] **Step 1: Extend TxRepo interface**

In `src/lib/api/repos.ts`, add to `TxRepo`:

```ts
export interface TxRepo {
  buy(input: { propertyId: string; quantity: number; priceUsdPerShare: number }): Promise<Transaction>;
  listTransactions(opts?: { limit?: number; offset?: number }): Promise<{ transactions: Transaction[]; hasMore: boolean }>;
}
```

- [ ] **Step 2: Implement in HTTP repos**

In `src/lib/api/http/http-repos.ts`, add after the existing `buy`:

```ts
async listTransactions(opts) {
  return client.get<{ transactions: Transaction[]; hasMore: boolean }>("/v1/transactions", {
    limit: String(opts?.limit ?? 50),
    offset: String(opts?.offset ?? 0),
  });
},
```

Add `Transaction` to imports:
```ts
import type { Transaction } from "@/types/transaction";
```

- [ ] **Step 3: Add seed transactions for all 4 kinds**

In `src/lib/mock/seed/transactions.ts`, replace with extended seed:

```ts
import type { Transaction } from "@/types/transaction";
import { makeSyntheticTxHash } from "@/lib/ton/synthetic-tx";
import { USER } from "./user";

export const TRANSACTIONS: Transaction[] = [
  // --- Buys ---
  {
    id: "tx-bayside-buy-success",
    kind: "buy",
    propertyId: "prop-bayside-marina-penthouse",
    userId: USER.id,
    shares: 60,
    amountUsd: 60 * 25000,
    status: "success",
    txHash: makeSyntheticTxHash(),
    createdAt: "2026-03-05T09:42:00Z",
  },
  {
    id: "tx-alfama-buy-success",
    kind: "buy",
    propertyId: "prop-alfama-terrace-flat",
    userId: USER.id,
    shares: 75,
    amountUsd: 75 * 10000,
    status: "success",
    txHash: makeSyntheticTxHash(),
    createdAt: "2026-04-19T12:10:00Z",
  },
  {
    id: "tx-marina-buy-pending",
    kind: "buy",
    propertyId: "prop-marina-vista-4b",
    userId: USER.id,
    shares: 10,
    amountUsd: 10 * 12500,
    status: "pending",
    txHash: makeSyntheticTxHash(),
    createdAt: "2026-07-22T18:05:00Z",
  },
  {
    id: "tx-tbilisi-buy-failed",
    kind: "buy",
    propertyId: "prop-tbilisi-riverhouse-loft",
    userId: USER.id,
    shares: 4,
    amountUsd: 4 * 8000,
    status: "failed",
    error: "wallet rejected the buy transaction",
    createdAt: "2026-07-15T10:20:00Z",
  },
  // --- Sell ---
  {
    id: "tx-alfama-sell-success",
    kind: "sell",
    propertyId: "prop-alfama-terrace-flat",
    userId: USER.id,
    shares: -25,
    amountUsd: -25 * 10500,
    status: "success",
    txHash: makeSyntheticTxHash(),
    createdAt: "2026-06-01T14:30:00Z",
  },
  // --- Earnings ---
  {
    id: "tx-weekly-earnings-jun28",
    kind: "earnings",
    userId: USER.id,
    amountUsd: 4200,
    status: "success",
    txHash: "simulated:dist-jun28",
    createdAt: "2026-06-28T00:00:00Z",
  },
  {
    id: "tx-weekly-earnings-jul05",
    kind: "earnings",
    userId: USER.id,
    amountUsd: 4200,
    status: "success",
    txHash: "simulated:dist-jul05",
    createdAt: "2026-07-05T00:00:00Z",
  },
  // --- Withdraw ---
  {
    id: "tx-withdraw-jul01",
    kind: "withdraw",
    userId: USER.id,
    amountUsd: -1000000,
    tonAmount: 5000000000,
    status: "success",
    txHash: makeSyntheticTxHash(),
    createdAt: "2026-07-01T09:00:00Z",
  },
  {
    id: "tx-withdraw-pending",
    kind: "withdraw",
    userId: USER.id,
    amountUsd: -500000,
    tonAmount: 2500000000,
    status: "pending",
    txHash: makeSyntheticTxHash(),
    createdAt: "2026-07-25T11:15:00Z",
  },
];
```

- [ ] **Step 4: Implement listTransactions in MockTxRepo**

In `src/lib/mock/transaction.ts`, add after `buy`:

```ts
async listTransactions(opts = {}) {
  await sleep(jitter());
  const limit = Math.min(opts.limit ?? 50, 100);
  const offset = opts.offset ?? 0;
  const sorted = [...seed.transactions]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(offset, offset + limit);
  const hasMore = seed.transactions.length > offset + limit;
  return { transactions: sorted, hasMore };
},
```

Also import the `Transaction` type if not already there (it is).

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck
```
Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/api/repos.ts src/lib/api/http/http-repos.ts src/lib/mock/transaction.ts src/lib/mock/seed/transactions.ts
git commit -m "feat(app): listTransactions repo method + extended seed data (P4-05)"
```

---

### Task 4: Create useTransactions hook

**Files:**
- Create: `src/hooks/useTransactions.ts`
- Modify: `src/hooks/index.ts`

- [ ] **Step 1: Create hook**

Create `src/hooks/useTransactions.ts`:

```ts
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRepo } from "@/lib/api/getRepo";

const PAGE_SIZE = 50;

export function useTransactions() {
  const [offset, setOffset] = useState(0);

  const query = useQuery({
    queryKey: ["transactions", offset],
    queryFn: () => getRepo().tx.listTransactions({ limit: PAGE_SIZE, offset }),
    staleTime: 30_000,
  });

  const loadMore = () => {
    if (query.data?.hasMore) {
      setOffset((o) => o + PAGE_SIZE);
    }
  };

  return {
    transactions: query.data?.transactions ?? [],
    hasMore: query.data?.hasMore ?? false,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    loadMore,
    refetch: query.refetch,
  };
}
```

- [ ] **Step 2: Export from hooks index**

In `src/hooks/index.ts`, add:
```ts
export { useTransactions } from "./useTransactions";
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```
Expected: pass.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useTransactions.ts src/hooks/index.ts
git commit -m "feat(app): useTransactions hook with pagination (P4-05)"
```

---

### Task 5: Create TransactionRow + TransactionList components

**Files:**
- Create: `src/components/transactions/TransactionRow.tsx`
- Create: `src/components/transactions/TransactionList.tsx`

**Note:** The transaction list screen may show ~50 rows, each row should be a clickable sliding disclosure (following the Earnings pattern). On tap, a `Disclosure` (or sheet) reveals the tx hash + explorer link or simulated badge.

- [ ] **Step 1: Create TransactionRow**

Create `src/components/transactions/TransactionRow.tsx`:

```tsx
"use client";

import { useState } from "react";
import type { Transaction } from "@/types/transaction";
import { Row } from "@/components/common/Row";
import { StatusPill } from "@/components/common/StatusPill";
import { isRealTxHash, canShowExplorerLink, buildExplorerTxUrl } from "@/lib/settlement/honesty";
import { usd } from "@/lib/format";
import { ArrowDownCircle, ArrowUpCircle, DollarSign, ArrowLeft, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { env } from "@/lib/env";

const KIND_ICON: Record<string, typeof ArrowDownCircle> = {
  buy: ArrowDownCircle,
  sell: ArrowUpCircle,
  earnings: DollarSign,
  withdraw: ArrowLeft,
};

const KIND_COLOR: Record<string, string> = {
  buy: "text-success",
  sell: "text-destructive",
  earnings: "text-primary",
  withdraw: "text-muted-foreground",
};

const KIND_LABEL: Record<string, string> = {
  buy: "Buy",
  sell: "Sell",
  earnings: "Earnings",
  withdraw: "Withdraw",
};

function showSimulatedTxBadge(
  txHash: string | undefined | null,
  status: string,
): boolean {
  if (status !== "success") return false;
  if (!txHash) return true;
  return !isRealTxHash(txHash);
}

type TransactionRowProps = {
  transaction: Transaction;
};

export function TransactionRow({ transaction }: TransactionRowProps) {
  const [expanded, setExpanded] = useState(false);
  const tx = transaction;
  const network = env.network;
  const Icon = KIND_ICON[tx.kind] ?? ArrowDownCircle;
  const color = KIND_COLOR[tx.kind] ?? "text-muted-foreground";
  const simulated = showSimulatedTxBadge(tx.txHash, tx.status);
  const showExplorer = tx.txHash ? canShowExplorerLink(tx.txHash, network) : false;
  const explorerUrl = tx.txHash ? buildExplorerTxUrl(tx.txHash, network) : null;

  return (
    <div>
      <Row
        onClick={() => setExpanded((v) => !v)}
      >
        <Icon className={`h-5 w-5 shrink-0 ${color}`} strokeWidth={1.75} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-medium text-foreground">
            {KIND_LABEL[tx.kind] ?? tx.kind}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {tx.propertyTitle ? (
              <span className="truncate">{tx.propertyTitle}</span>
            ) : (
              <span className="italic">—</span>
            )}
          </span>
        </div>
        <span className="text-right tabular-nums text-sm font-semibold text-foreground">
          {tx.kind === "earnings" || tx.kind === "withdraw" ? "" : ""}
          {usd(tx.amountUsd)}
        </span>
        <div className="flex items-center gap-1">
          <StatusPill
            label={tx.status === "success" ? "Success" : tx.status === "pending" ? "Pending" : "Failed"}
            variant={tx.status === "success" ? "success" : tx.status === "pending" ? "warning" : "error"}
            simulated={simulated}
          />
          {expanded ? (
            <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
        </div>
      </Row>
      {expanded && (
        <div className="mx-4 border-t border-border px-1 py-3">
          <div className="space-y-2 text-xs text-muted-foreground">
            {tx.txHash && (
              <div className="flex items-center justify-between">
                <span>Tx hash</span>
                {showExplorer && explorerUrl ? (
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary"
                  >
                    <span className="max-w-[160px] truncate font-mono">{tx.txHash}</span>
                    <ExternalLink size={12} strokeWidth={2} />
                  </a>
                ) : (
                  <span className="max-w-[200px] truncate font-mono text-foreground">
                    {tx.txHash}
                  </span>
                )}
              </div>
            )}
            {tx.shares != null && (
              <div className="flex justify-between">
                <span>Shares</span>
                <span className="tabular-nums text-foreground">{tx.shares}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Date</span>
              <span className="tabular-nums text-foreground">
                {new Date(tx.createdAt).toLocaleDateString()}
              </span>
            </div>
            {tx.error && (
              <div className="flex justify-between">
                <span>Error</span>
                <span className="text-destructive max-w-[200px] text-right">{tx.error}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create TransactionList**

Create `src/components/transactions/TransactionList.tsx`:

```tsx
"use client";

import type { Transaction } from "@/types/transaction";
import { Block } from "@/components/common/Block";
import { TransactionRow } from "./TransactionRow";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";

function SkeletonRow() {
  return (
    <div className="flex min-h-[48px] items-center gap-2 mx-4 border-t border-border first:border-t-0 animate-pulse">
      <div className="h-5 w-5 rounded-full bg-muted" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="h-3.5 w-24 rounded bg-muted" />
        <div className="h-3 w-16 rounded bg-muted" />
      </div>
      <div className="h-3.5 w-16 rounded bg-muted" />
      <div className="h-5 w-14 rounded bg-muted" />
    </div>
  );
}

type TransactionListProps = {
  transactions: Transaction[];
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  hasMore: boolean;
  onLoadMore: () => void;
  onRetry: () => void;
};

export function TransactionList({
  transactions,
  isLoading,
  isError,
  error,
  hasMore,
  onLoadMore,
  onRetry,
}: TransactionListProps) {
  // Loading skeleton
  if (isLoading && transactions.length === 0) {
    return (
      <section>
        <h2 className="px-1 text-[0.8125rem] font-medium text-muted-foreground">
          Transaction history
        </h2>
        <Block>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </Block>
      </section>
    );
  }

  // Error state
  if (isError && transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">
          {error?.message ?? "Could not load transactions"}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary"
        >
          <RefreshCw size={14} />
          Retry
        </button>
      </div>
    );
  }

  // Empty state
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12">
        <p className="text-sm text-muted-foreground">No transactions yet</p>
      </div>
    );
  }

  return (
    <section>
      <h2 className="px-1 text-[0.8125rem] font-medium text-muted-foreground">
        Transaction history
      </h2>
      <Block>
        {transactions.map((tx) => (
          <TransactionRow key={tx.id} transaction={tx} />
        ))}
      </Block>

      {hasMore && (
        <div className="px-1 pt-3">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-surface-2 py-3 text-sm font-medium text-foreground active:opacity-60 disabled:opacity-40"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            Show more
          </button>
        </div>
      )}

      {isLoading && transactions.length > 0 && (
        <div className="flex justify-center py-3">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 3: Verify env.network is accessible**

`env.network` is available from `@/lib/env` — type `TonNetwork`. No additional hook needed.

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```
Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/transactions/TransactionRow.tsx src/components/transactions/TransactionList.tsx
git commit -m "feat(app): TransactionRow + TransactionList components (P4-05)"
```

---

### Task 6: Create /transactions page

**Files:**
- Create: `src/app/(app)/transactions/page.tsx`
- Modify: `src/lib/constants.ts`

- [ ] **Step 1: Add route constant**

In `src/lib/constants.ts`, add to `ROUTES`:
```ts
transactions: "/transactions",
```

- [ ] **Step 2: Create page**

Create `src/app/(app)/transactions/page.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTransactions } from "@/hooks/useTransactions";
import { useTelegram } from "@/hooks/useTelegram";
import { TransactionList } from "@/components/transactions/TransactionList";
import { haptics } from "@/lib/telegram/haptics";
import { ROUTES } from "@/lib/constants";

export default function TransactionsPage() {
  const router = useRouter();
  const { transactions, isLoading, isError, error, hasMore, loadMore, refetch } = useTransactions();
  const { backButton } = useTelegram();

  useEffect(() => {
    try {
      backButton.show();
    } catch { /* ignore */ }
    let off: () => void = () => {};
    try {
      off = backButton.onClick(() => {
        haptics.selection();
        router.back();
      });
    } catch { /* ignore */ }
    return () => {
      off();
    };
  }, [backButton, router]);

  useEffect(() => {
    return () => {
      try { backButton.hide(); } catch { /* ignore */ }
    };
  }, [backButton]);

  return (
    <div className="space-y-4 pb-6">
      <TransactionList
        transactions={transactions}
        isLoading={isLoading}
        isError={isError}
        error={error}
        hasMore={hasMore}
        onLoadMore={loadMore}
        onRetry={() => {
          haptics.impact("light");
          void refetch();
        }}
      />
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```
Expected: pass.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(app\)/transactions/page.tsx src/lib/constants.ts
git commit -m "feat(app): transaction history page (P4-05)"
```

---

### Task 7: Add Settings link

**Files:**
- Modify: `src/components/settings/SettingsSheet.tsx`

- [ ] **Step 1: Add Transaction history button**

In `src/components/settings/SettingsSheet.tsx`, add after the "About / Legal" button in the Help section:

```tsx
            <button
              type="button"
              onClick={() => {
                haptics.selection();
                closeAll();
                router.push(ROUTES.transactions);
              }}
              className="flex w-full min-h-[56px] items-center gap-2 border-t border-border px-4 py-3.5 text-start active:bg-surface-2/60"
              data-testid="settings-transaction-history"
            >
              <span className="flex-1 text-sm font-medium leading-snug text-foreground">
                Transaction history
              </span>
              <ChevronRight
                size={20}
                strokeWidth={1.75}
                className="shrink-0 text-muted-foreground rtl:rotate-180"
                aria-hidden
              />
            </button>
```

- [ ] **Step 2: Typecheck + build**

```bash
npm run typecheck && npm run build
```
Expected: pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/settings/SettingsSheet.tsx
git commit -m "feat(app): Transaction history link in settings (P4-05)"
```

---

### Task 8: API route tests

**Files:**
- Create: `apps/api/src/routes/transactions.test.ts`

- [ ] **Step 1: Create test file**

Create `apps/api/src/routes/transactions.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import { createTransactionRoutes, type TransactionRouteDeps } from "./transactions.js";
import { createMemoryTxStore, type TransactionRecord } from "../buys/tx-store.js";
import { createMemoryUserStore } from "../auth/user-store.js";
import { signSessionToken } from "../auth/session.js";

const SESSION = { secret: "test-session-secret-32-chars-min!!", ttlSeconds: 3600 };

function seedUser(id: string, displayName: string) {
  return {
    id, displayName, username: null, photoUrl: null,
    role: "investor" as const, walletAddress: null, onboarded: false,
    useTelegramTheme: false, createdAt: new Date(), updatedAt: new Date(),
  };
}

const BASE_TXS: TransactionRecord[] = [
  {
    id: "tx-1", userId: "user-a", kind: "buy", propertyId: "prop-1",
    shares: 10, amountUsd: 100000, tonAmount: null, status: "success",
    txHash: "simulated:tx-1", error: null, buyIntentId: null, createdAt: new Date("2026-07-01"),
  },
  {
    id: "tx-2", userId: "user-a", kind: "earnings", propertyId: null,
    shares: null, amountUsd: 5000, tonAmount: null, status: "success",
    txHash: "simulated:tx-2", error: null, buyIntentId: null, createdAt: new Date("2026-07-02"),
  },
  {
    id: "tx-3", userId: "user-b", kind: "buy", propertyId: "prop-2",
    shares: 5, amountUsd: 50000, tonAmount: null, status: "success",
    txHash: "simulated:tx-3", error: null, buyIntentId: null, createdAt: new Date("2026-07-03"),
  },
  {
    id: "tx-4", userId: "user-a", kind: "sell", propertyId: "prop-1",
    shares: -5, amountUsd: -50000, tonAmount: null, status: "success",
    txHash: "simulated:tx-4", error: null, buyIntentId: null, createdAt: new Date("2026-07-04"),
  },
];

function makeDeps(over: Partial<TransactionRouteDeps> = {}): TransactionRouteDeps {
  return {
    session: SESSION,
    users: createMemoryUserStore([
      seedUser("user-a", "Alice"),
      seedUser("user-b", "Bob"),
    ]),
    transactions: createMemoryTxStore(BASE_TXS),
    ...over,
  };
}

describe("transaction routes", () => {
  describe("GET /v1/transactions", () => {
    it("returns 401 without auth", async () => {
      const app = new Hono().route("/", createTransactionRoutes(makeDeps()));
      const res = await app.request("/v1/transactions");
      expect(res.status).toBe(401);
    });

    it("returns caller's transactions only (IDOR)", async () => {
      const app = new Hono().route("/", createTransactionRoutes(makeDeps()));
      const { token } = await signSessionToken("user-a", SESSION);
      const res = await app.request("/v1/transactions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { transactions: Array<{ id: string }>; hasMore: boolean };
      // user-a has 3 txs (tx-1, tx-2, tx-4), user-b has 1 (tx-3)
      expect(body.transactions).toHaveLength(3);
      expect(body.transactions.every((t) => ["tx-1", "tx-2", "tx-4"].includes(t.id))).toBe(true);
      expect(body.hasMore).toBe(false);
    });

    it("user B cannot see user A's transactions", async () => {
      const app = new Hono().route("/", createTransactionRoutes(makeDeps()));
      const { token } = await signSessionToken("user-b", SESSION);
      const res = await app.request("/v1/transactions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { transactions: Array<{ id: string }> };
      expect(body.transactions).toHaveLength(1);
      expect(body.transactions[0]!.id).toBe("tx-3");
    });

    it("returns empty array for user with no transactions", async () => {
      const store = createMemoryTxStore(BASE_TXS);
      const deps = makeDeps({ transactions: store });
      const app = new Hono().route("/", createTransactionRoutes(deps));
      const { token } = await signSessionToken("no-tx-user", SESSION);
      const res = await app.request("/v1/transactions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { transactions: unknown[]; hasMore: boolean };
      expect(body.transactions).toEqual([]);
      expect(body.hasMore).toBe(false);
    });

    it("respects limit parameter", async () => {
      const app = new Hono().route("/", createTransactionRoutes(makeDeps()));
      const { token } = await signSessionToken("user-a", SESSION);
      const res = await app.request("/v1/transactions?limit=2", {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { transactions: Array<{ id: string }>; hasMore: boolean };
      expect(body.transactions).toHaveLength(2);
      expect(body.hasMore).toBe(true);
    });

    it("respects offset parameter", async () => {
      const app = new Hono().route("/", createTransactionRoutes(makeDeps()));
      const { token } = await signSessionToken("user-a", SESSION);
      const res = await app.request("/v1/transactions?limit=2&offset=2", {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { transactions: Array<{ id: string }>; hasMore: boolean };
      expect(body.transactions).toHaveLength(1); // user-a has 3 total, offset 2 → 1 remaining
      expect(body.hasMore).toBe(false);
    });
  });
});
```

- [ ] **Step 2: Run tests**

```bash
npm run test -w @digihouse/api -- src/routes/transactions.test.ts
```
Expected: PASS.

- [ ] **Step 3: Run full API suite**

```bash
npm run test -w @digihouse/api
```
Expected: all pass (should still be 146+ tests).

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/routes/transactions.test.ts
git commit -m "feat(api): transaction route tests with IDOR check (P4-05)"
```

---

### Task 9: Self-review + final check

- [ ] **Step 1: Full typecheck both projects**

```bash
npm run typecheck -w @digihouse/api
npm run typecheck
```
Expected: pass.

- [ ] **Step 2: Full API test suite**

```bash
npm run test -w @digihouse/api
```
Expected: all pass.

- [ ] **Step 3: Build**

```bash
npm run build
```
Expected: pass.

- [ ] **Step 4: npm run check**

```bash
npm run check
```
Expected: pass.

- [ ] **Step 5: Final commit**

```bash
git add -A && git commit -m "chore: final P4-05 checks"
```

- [ ] **Step 6: AC checklist**
- [ ] Only caller's rows (IDOR test ✅)
- [ ] Simulated hashes labeled; real hashes get explorer when allowed (useTonNetwork + isRealTxHash ✅)
- [ ] No God page — split list/row/page (TransactionList + TransactionRow + page ✅)
- [ ] npm run check green ✅
