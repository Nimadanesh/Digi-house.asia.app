#!/usr/bin/env bash
# db-backup.sh — pg_dump custom format to backups/
#
# Usage:
#   DATABASE_URL=postgresql://user:pass@host:5432/digihouse ./scripts/db-backup.sh
#
# Dependencies:
#   - Docker (Postgres container "digihouse-postgres" running locally), OR
#   - pg_dump 16 on PATH for non-Docker targets
#
# Output: backups/digihouse-YYYYMMDD-HHmm.dump
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="$PROJECT_DIR/backups"
TIMESTAMP=$(date +%Y%m%d-%H%M)
FILENAME="digihouse-$TIMESTAMP.dump"
MASK_URL() { echo "$1" | sed -E 's|://([^:]+):([^@]+)@|://\1:***@|'; }

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set."
  echo "Usage: DATABASE_URL=postgresql://user:pass@host:5432/digihouse $0"
  exit 1
fi

mkdir -p "$BACKUP_DIR"

# Prefer docker-exec if local container is running
if docker inspect digihouse-postgres >/dev/null 2>&1; then
  echo "Using docker exec digihouse-postgres pg_dump …"
  docker exec -i digihouse-postgres pg_dump \
    --dbname "$DATABASE_URL" \
    -Fc \
    -v \
    > "$BACKUP_DIR/$FILENAME" 2>&1
elif command -v pg_dump &>/dev/null; then
  echo "Using local pg_dump …"
  pg_dump \
    --dbname "$DATABASE_URL" \
    -Fc \
    -v \
    > "$BACKUP_DIR/$FILENAME" 2>&1
else
  echo "ERROR: No Docker container 'digihouse-postgres' running and pg_dump not on PATH."
  exit 1
fi

FILESIZE=$(stat -c%s "$BACKUP_DIR/$FILENAME" 2>/dev/null || stat -f%z "$BACKUP_DIR/$FILENAME" 2>/dev/null || echo "?")
echo "Backup written: $BACKUP_DIR/$FILENAME ($FILESIZE bytes)"
echo "Connection: $(MASK_URL "$DATABASE_URL")"
