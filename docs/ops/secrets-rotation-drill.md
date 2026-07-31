# Secrets Rotation Drill

> Rehearse rotating each secret type on **staging**. The procedure mirrors what prod will require, but against test/non-critical infrastructure.
>
> **Burn-on-leak rule (ADR-004 §5):** a leaked secret is **burned** — rotate, do not only delete from git history.
>
> Cross-references: [ADR-004 §5](../adr/ADR-004-key-hierarchy.md#5-rotation-and-break-glass) (rotation table),
> [ADR-004 §6](../adr/ADR-004-key-hierarchy.md#6-never-in-repo--ci-rule) (never-in-repo),
> [staging-deploy.md](./staging-deploy.md) (env var setting),
> [mainnet-dry-run.md](../runbooks/mainnet-dry-run.md) (step 8),
> [mainnet-checklist.md](./mainnet-checklist.md) (items 1.7, 2.7),
> [incident-response.md](../runbooks/incident-response.md) (compromise response)

---

## Secret types to rotate

| # | Secret | Prod location | Rotation frequency |
|---|---|---|---|
| 1 | `SESSION_SECRET` (JWT signing) | SM (AWS / Doppler / platform secrets) | On incident or quarterly |
| 2 | `TELEGRAM_BOT_TOKEN` | SM + BotFather | On incident or token expiry |
| 3 | `ADMIN_API_SECRET` | SM | On incident or quarterly |
| 4 | Database password (`DATABASE_URL`) | SM (managed Postgres) | On incident or annual rotation policy |

---

## General procedure

Each rotation follows the same sequence:

```
Issue new → Deploy → Verify → Revoke old → Verify again
```

### Step-by-step

**1. Issue new value**

| Secret | How to generate |
|---|---|
| `SESSION_SECRET` | `openssl rand -base64 32` (or platform SM generate) |
| `TELEGRAM_BOT_TOKEN` | BotFather → `/newbot` or revoke old → create new token |
| `ADMIN_API_SECRET` | `openssl rand -base64 32` |
| DB password | Managed Postgres console → rotate credentials or `ALTER USER ... PASSWORD` |

**2. Deploy new value**

Set the new secret in the platform secrets manager:

```bash
# Fly.io example:
fly secrets set SESSION_SECRET="<new-value>"

# Vercel example (for Mini App API):
vercel env rm NEXT_PUBLIC_DEV_TOKEN  # if set
```

Trigger a deploy (or the platform auto-redeploys on secret change):

```bash
fly deploy
```

**3. Verify auth still works**

After deploy, confirm the new secret is effective:

| Secret | Verification |
|---|---|
| `SESSION_SECRET` | `curl -X POST <api>/v1/auth/telegram -H "Content-Type: application/json" -d '{"initData":"<valid-init-data>"}'` → 200 with token |
| `TELEGRAM_BOT_TOKEN` | Same as above (initData HMAC depends on bot token) — auth returns 200 |
| `ADMIN_API_SECRET` | `curl -X POST <api>/v1/admin/properties/<id>/pause -H "X-Admin-Key: <new-value>"` → 200 |
| DB password | `curl <api>/healthz` → 200 (API connects to DB) |

**4. Revoke old value**

- `SESSION_SECRET`: old JWTs remain valid until expiry — set a short `SESSION_TTL_SECONDS` after rotation to force re-auth, or document the overlap window.
- `TELEGRAM_BOT_TOKEN`: revoke old token in BotFather. After revocation, old initData hashes will fail validation.
- `ADMIN_API_SECRET`: remove from SM and all stored copies.
- DB password: `ALTER USER ... PASSWORD` or rotate in Postgres console; old connections will drop.

**5. Verify after revocation**

Repeat step 3. Expect:

| Secret | Expected after revoke |
|---|---|
| `SESSION_SECRET` | Tokens issued before rotation still valid until expiry; new tokens use new secret |
| `TELEGRAM_BOT_TOKEN` | Old initData fails → 401; new initData (from updated bot) succeeds |
| `ADMIN_API_SECRET` | Old header value → 401; new header value → 200 |
| DB password | API healthz returns 200 (new password active); old connections closed |

---

## Burn-on-leak (ADR-004 §5)

If a secret is suspected compromised:

1. **Immediately** rotate per procedure above — do not wait for investigation.
2. Audit recent access logs for the compromised credential.
3. If a user-facing secret (e.g. `TELEGRAM_BOT_TOKEN`), notify affected users if initData forgery is possible.
4. File an incident per [incident-response.md](../runbooks/incident-response.md) template.

A leaked secret is **never** only deleted from git history — it must be revoked at the source.

---

## Drill log template

```text
## Drill <YYYY-MM-DD> — Secrets rotation on staging

### Operator
- Performed by: @name
- Witnessed by: @name

### Rotations

#### 1. SESSION_SECRET
- Old value: <masked> (not logged)
- New value: <masked>
- Deployed: YYYY-MM-DD HH:MM UTC
- Verified: auth returns 200 / PASS / FAIL
- Old revoked: YYYY-MM-DD HH:MM UTC
- Verified after revoke: / PASS / FAIL

#### 2. TELEGRAM_BOT_TOKEN
- Old value: <not logged>
- New value from BotFather: <not logged>
- Deployed: YYYY-MM-DD HH:MM UTC
- Verified: auth returns 200 / PASS / FAIL
- Old revoked in BotFather: YYYY-MM-DD HH:MM UTC
- Verified after revoke: / PASS / FAIL

#### 3. ADMIN_API_SECRET
- Old value: <not logged>
- New value: <not logged>
- Deployed: YYYY-MM-DD HH:MM UTC
- Verified: admin pause returns 200 / PASS / FAIL
- Old revoked: YYYY-MM-DD HH:MM UTC
- Verified after revoke: / PASS / FAIL

#### 4. Database password
- Old value: <not logged>
- New value: <not logged>
- Deployed: YYYY-MM-DD HH:MM UTC
- Verified: healthz returns 200 / PASS / FAIL
- Old revoked: YYYY-MM-DD HH:MM UTC
- Verified after revoke: / PASS / FAIL

### Overall
- All 4 rotated: YES / NO (reason: )
- Log filed by: @name
```

> **Never log the actual secret values.** The template above marks `<not logged>` and `<masked>` — enforce this in practice.
> For the dry-run, use test/staging values only. Prod rotation is a separate P5-09 action.
