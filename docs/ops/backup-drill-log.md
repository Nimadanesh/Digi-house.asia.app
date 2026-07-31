# Backup / Restore Drill Log

> One entry per drill execution. The first entry is a **SAMPLE** with fake hostnames.

---

## Drill template

```
## Drill <YYYY-MM-DD> — <operator name>

### Pre-flight
- [ ] Docker Postgres container running (`npm run infra:ps`)
- [ ] DATABASE_URL set
- [ ] Dump file present (size, age)

### Backup
- Script used: `scripts/db-backup.sh` / `db-backup.ps1`
- Output file: `backups/digihouse-YYYYMMDD-HHmm.dump`
- File size: ___ bytes
- Duration: ___ seconds
- Result: PASS / FAIL

### Restore drill
- Script used: `scripts/db-restore-drill.sh` / `db-restore-drill.ps1`
- Dump file used: `backups/digihouse-YYYYMMDD-HHmm.dump`
- Row counts:
  - properties:  ___
  - users:       ___
  - holdings:    ___
  - earnings:    ___
- Duration: ___ seconds
- Result: PASS / FAIL

### Notes
(any anomalies, warnings, observations)
```

---

## SAMPLE — 2026-07-30

```
## Drill 2026-07-30 — P5-04 implementation

### Pre-flight
- [x] Docker Postgres container running
- [x] DATABASE_URL set to postgresql://digihouse:digihouse@localhost:5432/digihouse
- [x] Dump file: fresh backup created during drill

### Backup
- Script used: `scripts/db-backup.sh`
- Output file: `backups/digihouse-20260730-1500.dump`
- File size: 245760 bytes
- Duration: ~3 seconds
- Result: PASS

### Restore drill
- Script used: `scripts/db-restore-drill.sh`
- Dump file used: `backups/digihouse-20260730-1500.dump`
- Row counts:
  - properties:  6
  - users:       12
  - holdings:    8
  - earnings:    24
- Duration: ~5 seconds
- Result: PASS

### Notes
- All tables restored with expected row counts.
- Temp database `digihouse_restore_drill` dropped successfully.
- No migration drift (restored dump matched current schema).
```
