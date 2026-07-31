# Backup / Restore Runbook — Postgres 16

**Cross-references**: [backup-drill-log.md](../ops/backup-drill-log.md), [incident-response.md](./incident-response.md), [ADR-001](../adr/ADR-001-settlement-modes.md), [env-matrix.md](../ops/env-matrix.md)

---

## RTO / RPO (proposals)

| Metric | Target | Notes |
|---|---|---|
| **RPO** (Recovery Point Objective) | **≤ 24 h** | How recent the restored data will be. Tighter if continuous archiving / WAL streaming is enabled (document actual). |
| **RTO** (Recovery Time Objective) | **≤ 4 h** | From declaration of DR event until the API data plane accepts reads with restored data. |

> These are **proposals** for human confirmation during P5-08 go/no-go. Actual RTO/RPO depend on backup frequency, restore method, and platform capabilities.

---

## Backup methods

| Method | Frequency | Scope | Tool |
|---|---|---|---|
| **pg_dump custom format** | On-demand (manual or CI) | Logical snapshot of all data | `scripts/db-backup.sh` / `db-backup.ps1` |
| **Platform snapshot** | Platform-dependent (e.g. RDS automated snapshots) | Entire volume | Cloud console / SDK |
| **Future: WAL archiving** | Not yet implemented | Continuous point-in-time recovery | `pg_basebackup` + WAL archive |

**Dual strategy (staging / prod):** Platform snapshot + pg_dump. Platform snapshots enable fast volume-level restore; pg_dump provides a portable logical backup that can be restored into any Postgres version.

---

## File format

- `backups/digihouse-YYYYMMDD-HHmm.dump`
- Custom format (`-Fc`) — compressed, supports parallel restore, flexible object selection
- `backups/` is gitignored (never committed)

---

## Local dev: prerequisites

1. Docker running with Postgres container:
   ```bash
   npm run infra:up
   ```

2. `DATABASE_URL` set (default: `postgresql://digihouse:digihouse@localhost:5432/digihouse`)

3. Scripts auto-detect Docker container or fall back to native `pg_dump` / `psql`.

---

## Backup (manual)

### Bash (macOS / Linux / WSL)
```bash
DATABASE_URL=postgresql://digihouse:digihouse@localhost:5432/digihouse \
  ./scripts/db-backup.sh
```
Output: `backups/digihouse-20260730-1500.dump`

### PowerShell (Windows)
```powershell
$env:DATABASE_URL="postgresql://digihouse:digihouse@localhost:5432/digihouse"
.\scripts\db-backup.ps1
```
Or set `DATABASE_URL` in `apps/api/.env` and it will auto-load.

---

## Restore drill (manual)

### Bash
```bash
DATABASE_URL=postgresql://digihouse:digihouse@localhost:5432/digihouse \
  ./scripts/db-restore-drill.sh backups/digihouse-20260730-1500.dump
```

### PowerShell
```powershell
$env:DATABASE_URL="postgresql://digihouse:digihouse@localhost:5432/digihouse"
.\scripts\db-restore-drill.ps1 backups\digihouse-20260730-1500.dump
```

### Drill behaviour
1. Creates temporary database `digihouse_restore_drill`
2. Restores the dump into it
3. Runs `SELECT count(*)` on `properties`, `users`, `holdings`, `earnings`
4. Drops the temporary database (unless `KEEP_DRILL_DB=1`)
5. Exits 0 on success, non-zero on failure

---

## Prod restore (not a drill)

For a real restore in staging/prod:

1. **Stop writes** — scale API to 0, pause workers (see [incident-response.md](./incident-response.md) pause-everything order).
2. **Choose source** — latest pg_dump file or platform snapshot.
3. **Restore to new DB instance** — never overwrite the production DB in-place.
4. **Run migrations** — if restoring from an older snapshot:
   ```bash
   cd apps/api && npx drizzle-kit migrate
   ```
5. **Point API at new DB** — update `DATABASE_URL` env var, redeploy.
6. **Verify** — run the restore drill SELECT checks against the new DB.
7. **Document** in the incident template (see `backup-drill-log.md`).

---

## Chaos notes

| Concern | Answer |
|---|---|
| **Redis flush ≠ Postgres restore** | Redis (rate-limiter, BullMQ) is ephemeral. Restoring Postgres does NOT restore Redis state. Pending jobs are lost; rate-limit counters reset. |
| **Chain is separate source of truth** | In on-chain settlement mode, on-chain balances are the canonical record. Restoring Postgres from backup does **not** make badges or balances on-chain-verifiable. See ADR-001 §3. |
| **Migrate state** | Drizzle migrations (`apps/api/drizzle/`) live in git. If you restore from an older dump, run `drizzle-kit migrate` to catch up the schema. The migration files are the source of truth for schema version. |

---

## Offline dry-run (no Docker)

If you want to test the scripts without Docker Postgres:

1. Install Postgres locally (e.g. `brew install postgresql@16`, `choco install postgresql16`).
2. Create a test database manually:
   ```bash
   createdb -U postgres digihouse_dryrun
   ```
3. Run `DATABASE_URL=postgresql://postgres@localhost:5432/digihouse_dryrun ./scripts/db-backup.sh`
4. For restore, skip CREATE DATABASE (already exists) by manually creating the drill DB:
   ```sql
   CREATE DATABASE digihouse_restore_drill;
   ```
   Then run the restore drill with `KEEP_DRILL_DB=1`.
