# P4-05: Transaction History Screen

## One-liner

User can view their transaction ledger (buy/sell/earnings/withdraw) with honesty-correct hashes.

## 1. API: `GET /v1/transactions`

**Auth:** `requireSession` middleware (Bearer JWT). Filters `user_id = caller` only — user can only see their own rows (IDOR-safe).

**Pagination:** Offset-based.
- `?limit=50` (default 50, max 100)
- `?offset=0` (default 0)
- Response: `{ transactions: TransactionPublic[], hasMore: boolean, total?: number }`

**Enrichment:** LEFT JOIN on `properties` to attach `property_title` and `property_image` to each row (first image from jsonb array).

**Order:** `created_at DESC`

## 2. Transaction type extension

### API `TransactionPublic` (in `tx-store.ts`)

Add optional fields:
```ts
propertyTitle?: string;
propertyImage?: string;
```

### Mini App `Transaction` (in `src/types/transaction.ts`)

Add same optional fields:
```ts
propertyTitle?: string;
propertyImage?: string;
```

## 3. TxStore extension

Add to `TxStore` interface + both implementations:

```ts
listByUserId(userId: string, opts?: { limit?: number; offset?: number }): Promise<TransactionRecord[]>;
```

### DB implementation
- SQL: `SELECT t.*, p.title as propertyTitle, p.images[1] as propertyImage FROM transactions t LEFT JOIN properties p ON t.property_id = p.id WHERE t.user_id = ? ORDER BY t.created_at DESC LIMIT ? OFFSET ?`
- Uses Drizzle with `leftJoin` and the existing `properties` table

### Memory implementation
- Filters in-memory rows by userId, sorts by createdAt desc, applies limit/offset
- Looks up property title/image from an injected property map or seed

## 4. Route file

`apps/api/src/routes/transactions.ts`:

```ts
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
      const limit = Math.min(Number(c.req.query("limit")) || 50, 100);
      const offset = Number(c.req.query("offset")) || 0;
      const rows = await deps.transactions.listByUserId(userId, { limit, offset });
      // Map TransactionRecord[] -> TransactionPublic[] (already exists as mapTransactionPublic)
      // But we need to add propertyTitle/propertyImage from the enriched row
      const transactions = rows.map(mapTransactionPublic);
      const hasMore = rows.length === limit;
      return c.json({ transactions, hasMore });
    },
  );

  return app;
}
```

The existing `mapTransactionPublic` maps `TransactionRecord` → `TransactionPublic`. We'll extend `TransactionRecord` with `propertyTitle` and `propertyImage` fields (optional) to carry the joined data through the store interface, then map them in the route handler.

### Wiring in app.ts

After buys routes:
```ts
if (users && transactions) {
  app.route("/", createTransactionRoutes({ session, users, transactions }));
}
```

## 5. Mini App data layer

### Repo extension

Add to `TxRepo` in `src/lib/api/repos.ts`:
```ts
listTransactions(opts?: { limit?: number; offset?: number }): Promise<{ transactions: Transaction[]; hasMore: boolean }>;
```

### HTTP implementation

```ts
listTransactions: (opts) =>
  client.get("/v1/transactions", { limit: String(opts?.limit ?? 50), offset: String(opts?.offset ?? 0) }),
```

### Mock implementation

Filters `seed.transactions` by userId from session token, applies limit/offset, adds property info from seed properties. Returns mock paginated response.

## 6. Hook: `useTransactions`

```ts
// src/hooks/useTransactions.ts
export function useTransactions() {
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const query = useQuery({
    queryKey: ["transactions", offset],
    queryFn: () => getRepo().tx.listTransactions({ limit, offset }),
  });

  const loadMore = () => {
    if (query.data?.hasMore) setOffset((o) => o + limit);
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

Pagination via "Show more" button at list bottom (Telegram-native: no infinite scroll, explicit tap-to-load).

## 7. Components

### `TransactionRow.tsx`

Single row in a `Block`/`Row`:

```
[icon] [title + subtitle] [amount]
       [property name]     [status]
```

- **Icon:** Lucide icon based on `kind` (buy → ArrowDownCircle, sell → ArrowUpCircle, earnings → DollarSign, withdraw → ArrowLeft)
- **Title:** Buy / Sell / Earnings / Withdraw (localized or hardcoded English)
- **Subtitle:** property name (if present), otherwise "—"
- **Amount:** `usd(amountUsd)` in tabular-nums
- **Status:** `StatusPill` with variant based on status (success/error/pending)
- **Simulated:** If `txHash` is simulated, show small "Simulated" badge via `StatusPill simulated` prop
- **Explorer link:** If `txHash` is real and `canShowExplorerLink`, show ExternalLink icon opening explorer URL

### `TransactionList.tsx`

List container:
- **Loading:** 5 skeleton rows (pulsing rectangles)
- **Empty:** "No transactions yet" with muted text + optional CTA to browse marketplace
- **Error:** Inline error with retry button
- **Loaded:** List of `TransactionRow` inside a `Block`
- **Load more:** "Show more" button at bottom if `hasMore`

### `TransactionPage` in `src/app/(app)/transactions/page.tsx`

- Header with back button (Telegram BackButton)
- Calls `useTransactions()`
- Renders `TransactionList`
- Loading: `<TransactionListSkeleton />`
- Error: `<ErrorState />` with retry

## 8. Settings link

In `SettingsSheetBody.tsx`, add to Help section (following `howItWorks` button pattern):

```tsx
<button
  type="button"
  onClick={() => { onClose(); router.push("/transactions"); }}
  className="flex w-full min-h-[56px] items-center gap-2 px-4 py-3.5 text-start active:bg-surface-2/60"
>
  <span className="flex-1 text-sm font-medium leading-snug text-foreground">
    Transaction history
  </span>
  <ChevronRight size={20} strokeWidth={1.75} className="shrink-0 text-muted-foreground" />
</button>
```

## 9. Honesty

- Reuse `isRealTxHash`, `canShowExplorerLink`, `buildExplorerTxUrl` from `src/lib/settlement/honesty.ts`
- `shouldShowSimulatedBadge` checks `status !== "paid"` — for transactions we check `status !== "success"` instead
- Simulated hashes labeled with "Simulated" badge; real hashes (testnet/mainnet) get explorer link
- Mock seed uses `"simulated:tx-xxx"` hashes, never real-looking ones

## 10. Seed data

Add to `src/lib/mock/seed/transactions.ts` (already exists with buy transactions):
- At least 8 transactions across all 4 kinds, different properties, different statuses
- Some with `"simulated:tx-..."` hashes
- At least one `"success"` buy with a real-looking hash that `isRealTxHash` would treat as real
- Multiple pages of data (e.g. 12 transactions) to test pagination

## 11. Tests

### API: `apps/api/src/routes/transactions.test.ts`
- Returns 401 without auth
- Returns caller's transactions only (user A sees A's rows, user B sees B's rows — IDOR)
- Returns empty array `[]` for user with no transactions
- Pagination: `?limit=2` returns 2 items + `hasMore: true`
- Response shape matches `{ transactions, hasMore }`

### Mini App
- Typecheck passes

## 12. Ownership guard checklist

- [ ] Component imports no `lib/ton`, `lib/mock`, raw `fetch` to R2
- [ ] Data flows: page → hook → repo → HTTP client → API (through existing integration boundaries)
- [ ] IDOR: `requireSession` + server-side `userId` filter — impossible to see another user's transactions
- [ ] No mock data leaking into production API responses
- [ ] Simulated hashes labeled; real hashes get explorer when `canShowExplorerLink` is true
