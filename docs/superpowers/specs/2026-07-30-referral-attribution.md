# P4-09: Referral startapp Param Attribution

## One-liner

Attribute referrals from `t.me/bot?startapp=ref_<code>` with server-side binding only — no reward economy.

## 1. Approach

Inline in auth route: `POST /v1/auth/telegram` already has `parsed.raw.start_param` from validated initData. Extract `ref_<userId>`, validate, and set `referred_by_user_id` on the user row during upsert. No new service, no separate referral table.

## 2. DB schema change

Add one nullable column to existing `users` table:

```sql
referred_by_user_id text references users(id)
-- ALTER TABLE users ADD COLUMN referred_by_user_id text REFERENCES users(id);
```

- Set once (first-write-wins — if already non-null, ignore subsequent attempts)
- Pure attribution: no reward fields, no referral table
- Drizzle migration: new column on `users` table

## 3. Type changes

### `UserRow` (Drizzle schema) / `UserPublic` (API response)

```diff
+ referredByUserId?: string;
```

### `TelegramProfileInput` (user-store.ts)

```diff
+ referredByUserId?: string;
```

### `UserProfile` (mini app `src/types/user.ts`)

```diff
+ referredByUserId?: string;
```

## 4. Store: `upsertFromTelegram` changes

Interface gains optional `referredByUserId?: string`.

**Drizzle implementation (`createDbUserStore`):**
- `INSERT ... ON CONFLICT (id) DO UPDATE` — only set `referred_by_user_id = EXCLUDED.referred_by_user_id` when the existing row's `referred_by_user_id` IS NULL
- Use a `CASE WHEN users.referred_by_user_id IS NULL THEN EXCLUDED.referred_by_user_id ELSE users.referred_by_user_id END`

**Memory implementation (`createMemoryUserStore`):**
- Same first-write-wins: only set if existing row's `referred_by_user_id` is null/undefined

## 5. Auth handler changes

In `POST /v1/auth/telegram`, after `validateInitData`:

```
startParam = parsed.raw.start_param
if startParam exists and starts with "ref_":
    referrerId = startParam.slice(4)
    if referrerId is non-empty AND referrerId !== callerUserId:
        referrer = users.findById(referrerId)
        if referrer exists:
            upsertPayload.referredByUserId = referrerId
```

**Security:**
- `parsed.raw.start_param` is from validated initData (HMAC-verified, server-side) — cannot be spoofed by crafting body JSON
- Referrer lookup uses existing `findById` — no new store method
- Self-referral: explicit `!==` check before lookup

**Mock path:** When `env.dataSource === "mock"`, initData validation is bypassed (no real Telegram token). The mock auth path (dev token) does NOT process referral — referral attribution only works through real Telegram initData validation.

## 6. Settings: "Invite friends" link

New `Block` between Preferences and Help sections in `SettingsSheet.tsx` with a single row:

| Row | Action |
|-----|--------|
| **Invite friends** | Copy `https://t.me/{botUsername}?startapp=ref_{user.id}` to clipboard |

- Uses `navigator.clipboard.writeText()` with `try/catch` for privacy modes
- After copy, row label temporarily changes to "Copied!" for 2 seconds (`useState<"invite"|"copied">`) then reverts — no toast library needed
- Triggers `haptics.selection()`
- `botUsername` from `env.botUsername` (NEXT_PUBLIC_TG_BOT_USERNAME)
- Link is `https://t.me/{botUsername}?startapp=ref_{user.id}` — no token or secret
- Only shown when `env.botUsername` is non-empty

## 7. Tests

### API route tests (`apps/api/src/routes/auth.test.ts`)

| # | Test | Expected |
|---|------|----------|
| 1 | InitData with valid `start_param=ref_<existing_user_id>` sets referred_by | `referredByUserId` set on returned user |
| 2 | InitData with `start_param=ref_<self_id>` (self-ref) | `referredByUserId` NOT set |
| 3 | InitData with `start_param=ref_<nonexistent_id>` | `referredByUserId` NOT set (invalid ref ignored silently) |
| 4 | Second auth with different referral | `referredByUserId` unchanged (first-write-wins) |
| 5 | Spoof: body has `referredByUserId` but no valid initData | Referral field in body ignored (only initData `start_param` is trusted) |

### DB migration test (optional)

Column exists, FK constraint works.

## 8. Environment

No new env vars. Uses existing `NEXT_PUBLIC_TG_BOT_USERNAME` for the share link.

## 9. Files changed

| File | Change |
|------|--------|
| `apps/api/src/db/schema/users.ts` | +`referredByUserId` column |
| `apps/api/src/db/migrations/*` | New migration |
| `apps/api/src/auth/user-store.ts` | +`referredByUserId` on `TelegramProfileInput`, first-write-wins in both implementations |
| `apps/api/src/auth/user-public.ts` | +`referredByUserId` on `UserPublic` |
| `apps/api/src/routes/auth.ts` | Parse `start_param`, validate ref, pass to upsert |
| `src/types/user.ts` | +`referredByUserId` |
| `src/components/settings/SettingsSheet.tsx` | +"Invite friends" Block with copy link |
| `apps/api/src/routes/auth.test.ts` | +5 referral tests |
