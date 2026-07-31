#!/usr/bin/env bash
# DigiHouse P5-10 — On-call health pull (healthz + marketplace)
# Usage: bash scripts/oncall-health.sh [base_url]
# Default URL: production API
#
# No auth required. Exits 0 if all checks pass, non-zero on failure.
#
# Cross-ref: docs/ops/on-call-week.md

set -euo pipefail

BASE_URL="${1:-https://api.digihouse.app}"
TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
EXIT_CODE=0

echo "=== DigiHouse On-Call Health — $TIMESTAMP ==="
echo "Target: $BASE_URL"
echo ""

# ── Check 1: /healthz ────────────────────────────────────────────────
HEALTHZ_OUTPUT=""
HEALTHZ_STATUS=""
if HEALTHZ_OUTPUT="$(curl -sS --max-time 10 "$BASE_URL/healthz" 2>&1)"; then
  HEALTHZ_STATUS="$(echo "$HEALTHZ_OUTPUT" | jq -r '.status // "unknown"' 2>/dev/null || echo "parse_failed")"
  LAUNCH_MODE="$(echo "$HEALTHZ_OUTPUT" | jq -r '.launchMode // "unknown"' 2>/dev/null || echo "unknown")"
  UPTIME="$(echo "$HEALTHZ_OUTPUT" | jq -r '.uptime // "unknown"' 2>/dev/null || echo "unknown")"
  echo "Healthz  : $HEALTHZ_STATUS (launchMode=$LAUNCH_MODE, uptime=$UPTIME)"
  if [ "$HEALTHZ_STATUS" != "ok" ]; then
    echo "  ❌ healthz.status is '$HEALTHZ_STATUS', expected 'ok'" >&2
    EXIT_CODE=1
  else
    echo "  ✅"
  fi
else
  echo "Healthz  : ❌ FAILED — $HEALTHZ_OUTPUT" >&2
  EXIT_CODE=1
fi

# ── Check 2: /v1/marketplace ─────────────────────────────────────────
MARKET_OUTPUT=""
LATENCY_MS=""
PROP_COUNT=""
if MARKET_OUTPUT="$(curl -sS --max-time 15 -w '%{http_code} %{time_total}' -o /tmp/digihouse-oncall-market.json "$BASE_URL/v1/marketplace" 2>&1)"; then
  HTTP_CODE="$(echo "$MARKET_OUTPUT" | awk '{print $1}')"
  TIME_TOTAL="$(echo "$MARKET_OUTPUT" | awk '{print $2}')"
  LATENCY_MS="$(echo "$TIME_TOTAL * 1000" | bc 2>/dev/null || echo "0")"
  PROP_COUNT="$(jq '.properties | length' /tmp/digihouse-oncall-market.json 2>/dev/null || echo "?")"
  echo "Market   : $PROP_COUNT properties, HTTP $HTTP_CODE, ${LATENCY_MS}ms"

  if [ "$HTTP_CODE" != "200" ]; then
    echo "  ❌ HTTP $HTTP_CODE (expected 200)" >&2
    EXIT_CODE=1
  elif [ "$(echo "$LATENCY_MS >= 1000" | bc 2>/dev/null)" = "1" ]; then
    echo "  ⚠ Latency ${LATENCY_MS}ms >= 1000ms threshold"
  else
    echo "  ✅"
  fi
else
  echo "Market   : ❌ FAILED — $MARKET_OUTPUT" >&2
  EXIT_CODE=1
fi

# ── Result ────────────────────────────────────────────────────────────
echo ""
if [ "$EXIT_CODE" -eq 0 ]; then
  echo "Result   : ✅ PASS"
else
  echo "Result   : ❌ FAIL (one or more checks failed)"
fi

exit "$EXIT_CODE"
