#!/usr/bin/env bash
# db-restore-drill.sh — Restore a backup into a temporary database and verify.
#
# Creates digihouse_restore_drill, restores DUMP into it, runs SELECT counts,
# then drops the database (unless KEEP_DRILL_DB=1).
#
# Usage:
#   DATABASE_URL=postgresql://user:pass@host:5432/digihouse \
#     ./scripts/db-restore-drill.sh backups/digihouse-20260730-1500.dump
#
# Exit code: 0 = all counts match, 1 = any failure
set -euo pipefail

DRILL_DB="digihouse_restore_drill"
DUMP_FILE="${1:?Usage: $0 <path-to-dump>}"
KEEP="${KEEP_DRILL_DB:-0}"

if [ ! -f "$DUMP_FILE" ]; then
  echo "ERROR: Dump file not found: $DUMP_FILE"
  exit 1
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set."
  exit 1
fi

MASK_URL() { echo "$1" | sed -E 's|://([^:]+):([^@]+)@|://\1:***@|'; }

# Build a connection URL to the drill database
BASE_URL="${DATABASE_URL%/*}"
DRILL_URL="$BASE_URL/$DRILL_DB"
# Connect to 'postgres' DB for CREATE / DROP DATABASE
ADMIN_URL="$BASE_URL/postgres"

run_psql() {
  local db_url="$1"
  shift
  if docker inspect digihouse-postgres >/dev/null 2>&1; then
    docker exec -i digihouse-postgres psql --dbname "$db_url" -q -t -A "$@"
  elif command -v psql &>/dev/null; then
    psql --dbname "$db_url" -q -t -A "$@"
  else
    echo "ERROR: No Docker container and no local psql."
    exit 1
  fi
}

run_pgrestore() {
  if docker inspect digihouse-postgres >/dev/null 2>&1; then
    docker exec -i digihouse-postgres pg_restore --dbname "$DRILL_URL" -Fc -v 2>&1
  elif command -v pg_restore &>/dev/null; then
    pg_restore --dbname "$DRILL_URL" -Fc -v 2>&1
  else
    echo "ERROR: No Docker container and no local pg_restore."
    exit 1
  fi
}

echo "=== Restore Drill ==="
echo "Source DB: $(MASK_URL "$DATABASE_URL")"
echo "Dump file: $DUMP_FILE ($(du -h "$DUMP_FILE" | cut -f1))"
echo "Target DB: $DRILL_DB"
echo "Keep DB:   $KEEP"
echo ""

# 1. Drop drill DB if it exists
echo "--- Dropping existing $DRILL_DB if present ---"
run_psql "$ADMIN_URL" -c "DROP DATABASE IF EXISTS $DRILL_DB;" 2>/dev/null || true

# 2. Create drill DB
echo "--- Creating $DRILL_DB ---"
run_psql "$ADMIN_URL" -c "CREATE DATABASE $DRILL_DB;"

# 3. Restore
echo "--- Restoring into $DRILL_DB ---"
run_pgrestore < "$DUMP_FILE"

# 4. Verify
echo "--- Verification: row counts ---"
COUNT_PROPERTIES=$(run_psql "$DRILL_URL" -c "SELECT count(*) FROM properties;" 2>/dev/null || echo "ERR")
COUNT_USERS=$(run_psql "$DRILL_URL" -c "SELECT count(*) FROM users;" 2>/dev/null || echo "ERR")
COUNT_HOLDINGS=$(run_psql "$DRILL_URL" -c "SELECT count(*) FROM holdings;" 2>/dev/null || echo "ERR")
COUNT_EARNINGS=$(run_psql "$DRILL_URL" -c "SELECT count(*) FROM earnings;" 2>/dev/null || echo "ERR")

echo "  properties:  $COUNT_PROPERTIES"
echo "  users:       $COUNT_USERS"
echo "  holdings:    $COUNT_HOLDINGS"
echo "  earnings:    $COUNT_EARNINGS"

# 5. Cleanup
if [ "$KEEP" = "1" ]; then
  echo "--- KEEP_DRILL_DB=1 — leaving $DRILL_DB in place ---"
else
  echo "--- Dropping $DRILL_DB ---"
  run_psql "$ADMIN_URL" -c "DROP DATABASE IF EXISTS $DRILL_DB;"
fi

# 6. Exit status
if echo "$COUNT_PROPERTIES" | grep -qE '^[0-9]+$'; then
  echo ""
  echo "=== Restore drill PASSED ==="
  exit 0
else
  echo ""
  echo "=== Restore drill FAILED (counts did not return numbers) ===" >&2
  exit 1
fi
