# Referral startapp Attribution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Attribute referrals from `t.me/bot?startapp=ref_<userId>` with server-side binding — no reward economy.

**Architecture:** Inline in auth route: parse `parsed.raw.start_param` from validated initData, resolve `ref_<referrerUserId>`, set `referred_by_user_id` on user row during upsert (first-write-wins). Add "Invite friends" copy-link row in Settings.

**Tech Stack:** Hono (API), Drizzle ORM + Postgres (DB), Next.js (Mini App), shadcn/ui + Tailwind v4

## Global Constraints

- Money as integer minor units (cents); TON as nanoTON (bigint)
- TypeScript strict, no `any`
- Named exports; PascalCase components; camelCase utils/hooks
- Tailwind utility classes only (no inline styles); 2-space indent
- Mobile-first; max app width 480px; safe-area aware
- English copy only
- All `NEXT_PUBLIC_*` env vars read through `src/lib/env.ts` — never `process.env` directly

---
### Task 1: DB schema + type changes

**Files:**
- Modify: `apps/api/src/db/schema/users.ts`
- Create: `apps/api/drizzle/0001_<slug>.sql` (migration file)
- Modify: `apps/api/src/auth/user-public.ts`
- Modify: `apps/api/src/auth/user-store.ts` (types only — store logic in Task 2)
- Modify: `src/types/user.ts`

**Interfaces:**
- Consumes: existing `users` table schema, `UserRow`, `UserPublic`, `TelegramProfileInput`, `UserProfile`
- Produces: schema + types with `referredByUserId` — consumed by all later tasks

- [ ] **Step 1: Add column to Drizzle schema**

Edit `apps/api/src/db/schema/users.ts`. Add after `useTelegramTheme` line:

```ts
    referredByUserId: text("referred_by_user_id"),
```

- [ ] **Step 2: Add FK to migration**

Create `apps/api/drizzle/0001_referrals.sql`:

```sql
ALTER TABLE "users" ADD COLUMN "referred_by_user_id" text REFERENCES "users"("id");
```

- [ ] **Step 3: Update `UserPublic` type**

In `apps/api/src/auth/user-public.ts`, add to `UserPublic`:

```ts
  referredByUserId?: string;
```

And to `toUserPublic`:

```ts
    ...(row.referredByUserId ? { referredByUserId: row.referredByUserId } : {}),
```

- [ ] **Step 4: Update `TelegramProfileInput` type**

In same file, add to `TelegramProfileInput`:

```ts
  referredByUserId?: string;
```

- [ ] **Step 5: Update Mini App `UserProfile`**

In `src/types/user.ts`, add:

```ts
  referredByUserId?: string;
```

- [ ] **Step 6: Typecheck**

```bash
npm run typecheck -w @digihouse/api
```
Expected: pass (0 errors)

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/db/schema/users.ts apps/api/drizzle/0001_referrals.sql apps/api/src/auth/user-public.ts src/types/user.ts
git commit -m "feat(db): referred_by_user_id column and types (P4-09)"
```

---
### Task 2: UserStore — `referredByUserId` in upsert (both impls)

**Files:**
- Modify: `apps/api/src/auth/user-store.ts`

**Interfaces:**
- Consumes: `UserStore`, `TelegramProfileInput` (from Task 1), `UserRow`, `UserPublic`
- Produces: `upsertFromTelegram` accepts `referredByUserId`, first-write-wins in both implementations

- [ ] **Step 1: Update `createDbUserStore` — Drizzle upsert**

In `apps/api/src/auth/user-store.ts`, modify the `upsertFromTelegram` implementation.

Change the `onConflictDoUpdate` block to:

```ts
        .onConflictDoUpdate({
          target: users.id,
          set: {
            displayName: input.displayName,
            username: input.username ?? null,
            photoUrl: input.photoUrl ?? null,
            referredByUserId: sql`CASE WHEN ${users.referredByUserId} IS NULL THEN ${input.referredByUserId ?? null} ELSE ${users.referredByUserId} END`,
            updatedAt: now,
          },
        })
```

Add the import at the top:

```ts
import { eq, sql } from "drizzle-orm";
```

Also add `referredByUserId: input.referredByUserId ?? null` to the initial `.values({})` block (for insert path — first time user).

- [ ] **Step 2: Update `createMemoryUserStore` — first-write-wins**

In the memory implementation, add to the new-user creation:

```ts
referredByUserId: input.referredByUserId ?? null,
```

And for the update path:

```ts
const updated: UserRow = {
  ...existing,
  displayName: input.displayName,
  username: input.username ?? null,
  photoUrl: input.photoUrl ?? null,
  referredByUserId: existing.referredByUserId ?? (input.referredByUserId ?? null),
  updatedAt: now,
};
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck -w @digihouse/api
```
Expected: pass

- [ ] **Step 4: Run existing tests to confirm no regression**

```bash
npm run test -w @digihouse/api
```
Expected: all existing tests pass

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/auth/user-store.ts
git commit -m "feat(api): referredByUserId in upsert with first-write-wins (P4-09)"
```

---
### Task 3: Auth route — parse `start_param`, validate referral

**Files:**
- Modify: `apps/api/src/routes/auth.ts`

**Interfaces:**
- Consumes: `UserStore.upsertFromTelegram` now accepts `referredByUserId` (from Task 2), `parsed.raw.start_param` from `validateInitData`
- Produces: referral-attributed users on auth

- [ ] **Step 1: Add referral parsing after initData validation**

In `apps/api/src/routes/auth.ts`, after the `displayName` assignment (line ~78) and before `upsertFromTelegram` call (line ~80), add:

```ts
    // referral attribution
    let referredByUserId: string | undefined;
    const startParam = parsed.raw["start_param"];
    if (typeof startParam === "string" && startParam.startsWith("ref_")) {
      const candidate = startParam.slice(4);
      if (candidate && candidate !== parsed.userId) {
        const referrer = await deps.users.findById(candidate);
        if (referrer) {
          referredByUserId = candidate;
        }
      }
    }
```

- [ ] **Step 2: Pass `referredByUserId` to `upsertFromTelegram`**

Change the `upsertFromTelegram` call from:

```ts
    const user = await deps.users.upsertFromTelegram({
      userId: parsed.userId,
      displayName,
      username: parsed.username,
      photoUrl: parsed.photoUrl,
    });
```

to:

```ts
    const user = await deps.users.upsertFromTelegram({
      userId: parsed.userId,
      displayName,
      username: parsed.username,
      photoUrl: parsed.photoUrl,
      referredByUserId,
    });
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck -w @digihouse/api
```
Expected: pass

- [ ] **Step 4: Run existing tests**

```bash
npm run test -w @digihouse/api
```
Expected: all existing tests pass

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/routes/auth.ts
git commit -m "feat(api): parse start_param for referral attribution on auth (P4-09)"
```

---
### Task 4: Settings "Invite friends" link

**Files:**
- Modify: `src/components/settings/SettingsSheet.tsx`

**Interfaces:**
- Consumes: `env.botUsername` from `@/lib/env`, `user.id` from the auth store, `haptics` from `@/lib/telegram/haptics`
- Produces: Copy-ref-link row in Settings

- [ ] **Step 1: Add imports**

Add to the existing imports in `SettingsSheet.tsx`:

```ts
import { env } from "@/lib/env";
import { useAuthStore } from "@/stores/auth.store";
import { Copy, Check } from "lucide-react";
```

- [ ] **Step 2: Add state and copy handler inside `SettingsSheetBody`**

Add after the `closeAll` callback:

```ts
  const user = useAuthStore((s) => s.user);
  const [copied, setCopied] = useState(false);
```

Add after the `openHowItWorks` function:

```ts
  async function onInviteFriends() {
    haptics.selection();
    if (!env.botUsername || !user) return;
    const link = `https://t.me/${env.botUsername}?startapp=ref_${user.id}`;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // fallback for privacy-restricted contexts — silently ignore
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
```

- [ ] **Step 3: Add "Invite friends" Block**

Add a new `<section>` between the Preferences section (ends at line ~173) and the Help section (starts at line ~175):

```tsx
        <section className="space-y-2">
          <SectionLabel className="px-0.5">Referrals</SectionLabel>
          <Block>
            <button
              type="button"
              onClick={() => void onInviteFriends()}
              className="flex w-full min-h-[56px] items-center gap-2 px-4 py-3.5 text-start active:bg-surface-2/60"
              data-testid="settings-invite-friends"
              disabled={!env.botUsername}
            >
              <span className="flex-1 text-sm font-medium leading-snug text-foreground">
                {copied ? "Copied!" : "Invite friends"}
              </span>
              {copied ? (
                <Check size={20} strokeWidth={1.75} className="shrink-0 text-success" aria-hidden />
              ) : (
                <Copy size={20} strokeWidth={1.75} className="shrink-0 text-muted-foreground" aria-hidden />
              )}
            </button>
          </Block>
        </section>
```

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```
Expected: pass

- [ ] **Step 5: Commit**

```bash
git add src/components/settings/SettingsSheet.tsx
git commit -m "feat(app): Invite friends copy-link in settings (P4-09)"
```

---
### Task 5: Tests

**Files:**
- Modify: `apps/api/src/routes/auth.test.ts`

**Interfaces:**
- Consumes: `buildInitDataForTests` (supports `extra`), `createMemoryUserStore`, `createApp`
- Produces: 5 referral-attribution test cases

- [ ] **Step 1: Add referral tests to auth.test.ts**

Add a new `describe("referral attribution")` block at the end of the file:

```ts
describe("referral attribution", () => {
  it("sets referred_by when start_param=ref_<existing_user>", async () => {
    const users = createMemoryUserStore();
    // pre-seed a referrer
    const refUser = await users.upsertFromTelegram({
      userId: "111",
      displayName: "Referrer",
    });
    const { app } = makeApp(users);

    const initData = buildInitDataForTests(FIXTURE_BOT_TOKEN, {
      authDate: Math.floor(Date.now() / 1000) - 5,
      user: { id: 222, first_name: "NewUser" },
      extra: { start_param: "ref_111" },
    });

    const res = await app.request("/v1/auth/telegram", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ initData }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { user: { id: string; referredByUserId?: string } };
    expect(body.user.referredByUserId).toBe("111");
  });

  it("ignores self-referral (start_param=ref_<own_id>)", async () => {
    const users = createMemoryUserStore();
    const { app } = makeApp(users);

    const userId = "333";
    const initData = buildInitDataForTests(FIXTURE_BOT_TOKEN, {
      authDate: Math.floor(Date.now() / 1000) - 5,
      user: { id: Number(userId), first_name: "SelfRef" },
      extra: { start_param: `ref_${userId}` },
    });

    const res = await app.request("/v1/auth/telegram", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ initData }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { user: { referredByUserId?: string } };
    expect(body.user.referredByUserId).toBeUndefined();
  });

  it("ignores start_param=ref_<nonexistent_user>", async () => {
    const { app } = makeApp();
    const initData = buildInitDataForTests(FIXTURE_BOT_TOKEN, {
      authDate: Math.floor(Date.now() / 1000) - 5,
      user: { id: 444, first_name: "NoRef" },
      extra: { start_param: "ref_99999" },
    });

    const res = await app.request("/v1/auth/telegram", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ initData }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { user: { referredByUserId?: string } };
    expect(body.user.referredByUserId).toBeUndefined();
  });

  it("first-write-wins — second auth with different ref is ignored", async () => {
    const users = createMemoryUserStore();
    // pre-seed referrers
    await users.upsertFromTelegram({ userId: "aaa", displayName: "RefA" });
    await users.upsertFromTelegram({ userId: "bbb", displayName: "RefB" });

    const { app } = makeApp(users);
    const userId = 555;
    const now = Math.floor(Date.now() / 1000);

    // first auth with ref_aaa
    const first = buildInitDataForTests(FIXTURE_BOT_TOKEN, {
      authDate: now - 5,
      user: { id: userId, first_name: "Target" },
      extra: { start_param: "ref_aaa" },
    });
    const r1 = await app.request("/v1/auth/telegram", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ initData: first }),
    });
    expect(r1.status).toBe(200);
    expect(((await r1.json()) as { user: { referredByUserId: string } }).user.referredByUserId).toBe("aaa");

    // second auth with ref_bbb
    const second = buildInitDataForTests(FIXTURE_BOT_TOKEN, {
      authDate: now - 4,
      user: { id: userId, first_name: "Target" },
      extra: { start_param: "ref_bbb" },
    });
    const r2 = await app.request("/v1/auth/telegram", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ initData: second }),
    });
    expect(r2.status).toBe(200);
    const body2 = (await r2.json()) as { user: { referredByUserId: string } };
    expect(body2.user.referredByUserId).toBe("aaa"); // unchanged
  });

  it("ignores referredByUserId in body when initData is valid but has no start_param", async () => {
    const { app } = makeApp();
    const initData = buildInitDataForTests(FIXTURE_BOT_TOKEN, {
      authDate: Math.floor(Date.now() / 1000) - 5,
      user: { id: 666, first_name: "SpoofTest" },
      // no start_param in initData
    });

    const res = await app.request("/v1/auth/telegram", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ initData, referredByUserId: "111" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { user: { referredByUserId?: string } };
    expect(body.user.referredByUserId).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run full API test suite**

```bash
npm run test -w @digihouse/api
```
Expected: 152 + 5 = 157 passed (all green)

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/routes/auth.test.ts
git commit -m "feat(api): referral attribution tests (P4-09)"
```

---
### Task 6: Final check + integration

**Files:**
- No new files — run verification

- [ ] **Step 1: Run full check**

```bash
npm run check
```
Expected: 0 errors, 5 pre-existing warnings

- [ ] **Step 2: Push (optional)**

```bash
git add -A
git commit -m "feat: referral startapp attribution (P4-09)"
```
