#!/usr/bin/env bash
# DigiHouse P1-18 — Load smoke on marketplace GET
# Usage: bash scripts/smoke-marketplace.sh [url]
# Default URL: staging API marketplace endpoint
#
# Requires: node + npx (autocannon is fetched via npx)
# Alternative: install autocannon globally (npm i -g autocannon)
#
# Windows users: run via Git Bash, WSL, or MSYS2.
# Windows-native: node scripts/smoke-marketplace.mjs (future)
#
# Output: prints summary to stdout, saves raw JSON to /tmp/ and
#         appends a timestamped entry to docs/ops/smoke-marketplace-results.md

set -euo pipefail

BASE_URL="${1:-https://digihouse-api-staging.fly.dev}"
URL="${BASE_URL}/v1/marketplace"
CONCURRENCY=100
DURATION_SECONDS=10
TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u +%Y-%m-%dT%H:%M:%S 2>/dev/null || echo "unknown")"
OUTFILE="/tmp/digihouse-smoke-$(date +%s 2>/dev/null || echo $$).json"

echo "=========================================="
echo "  DigiHouse Smoke Test"
echo "  Target:  $URL"
echo "  Concurrency: $CONCURRENCY"
echo "  Duration: ${DURATION_SECONDS}s"
echo "  Timestamp: $TIMESTAMP"
echo "=========================================="
echo ""

# Ensure autocannon is available
if ! command -v autocannon &>/dev/null; then
  if ! npx --yes autocannon --version &>/dev/null 2>&1; then
    echo "autocannon not found. Installing..."
    npm install -g autocannon
  fi
fi

# Run smoke test — captures JSON output
echo "Running autocannon..."
npx autocannon \
  --connections "$CONCURRENCY" \
  --duration "$DURATION_SECONDS" \
  --json \
  --renderStatusCodes \
  "$URL" 2>/dev/null | tee "$OUTFILE"

echo ""
echo "Raw results saved to: $OUTFILE"
echo ""

# Extract key metrics from JSON output
LATENCY_AVG=$(grep -o '"average":[0-9.]*' "$OUTFILE" | head -1 | cut -d: -f2)
LATENCY_P50=$(grep -o '"p50":[0-9.]*' "$OUTFILE" | head -1 | cut -d: -f2)
LATENCY_P75=$(grep -o '"p75":[0-9.]*' "$OUTFILE" | head -1 | cut -d: -f2)
LATENCY_P90=$(grep -o '"p90":[0-9.]*' "$OUTFILE" | head -1 | cut -d: -f2)
LATENCY_P99=$(grep -o '"p99":[0-9.]*' "$OUTFILE" | head -1 | cut -d: -f2)
REQ_TOTAL=$(grep -o '"requests":{"total":[0-9]*' "$OUTFILE" | grep -o '[0-9]*$')
REQ_AVG=$(grep -o '"requests":{"average":[0-9.]*' "$OUTFILE" | cut -d: -f3)
ERRORS=$(grep -o '"errors":[0-9]*' "$OUTFILE" | head -1 | cut -d: -f2)
TIMEOUTS=$(grep -o '"timeouts":[0-9]*' "$OUTFILE" | head -1 | cut -d: -f2)
DURATION=$(grep -o '"duration":[0-9.]*' "$OUTFILE" | head -1 | cut -d: -f2)

echo "=== Summary ==="
echo "Target:       $URL"
echo "Duration:     ${DURATION}s (target ${DURATION_SECONDS}s)"
echo "Total req:    $REQ_TOTAL"
echo "Avg req/s:    $REQ_AVG"
echo "Latency avg:  ${LATENCY_AVG:-N/A}ms"
echo "Latency p50:  ${LATENCY_P50:-N/A}ms | p75: ${LATENCY_P75:-N/A}ms"
echo "Latency p90:  ${LATENCY_P90:-N/A}ms | p99: ${LATENCY_P99:-N/A}ms"
echo "Errors:       ${ERRORS:-0} | Timeouts: ${TIMEOUTS:-0}"
echo ""

# Determine verdict
VERDICT="PASS"
REASONS=()
if [ -n "$LATENCY_P99" ] && [ "$(echo "$LATENCY_P99 >= 1000" | bc 2>/dev/null)" = "1" ]; then
  VERDICT="FAIL"; REASONS+=("p99 ${LATENCY_P99}ms >= 1000ms threshold")
fi
if [ -n "${ERRORS:-}" ] && [ "$ERRORS" -gt 0 ]; then
  ERR_RATE=$(echo "scale=4; $ERRORS / $REQ_TOTAL * 100" | bc 2>/dev/null || echo "0")
  if [ -n "$ERR_RATE" ] && [ "$(echo "$ERR_RATE >= 1" | bc 2>/dev/null)" = "1" ]; then
    VERDICT="FAIL"; REASONS+=("error rate ${ERR_RATE}% >= 1% threshold")
  fi
fi

# Append to results doc
cat >> docs/ops/smoke-marketplace-results.md << EOF

## Run $(date +%Y-%m-%d_%H-%M 2>/dev/null || echo "$TIMESTAMP")

| Field | Value |
|---|---|
| Target | \`$URL\` |
| Concurrency | $CONCURRENCY |
| Duration | ${DURATION}s |
| Timestamp | $TIMESTAMP |
| **Total requests** | $REQ_TOTAL |
| **Avg req/s** | $REQ_AVG |
| **Latency avg** | ${LATENCY_AVG:-N/A}ms |
| **Latency p50** | ${LATENCY_P50:-N/A}ms |
| **Latency p75** | ${LATENCY_P75:-N/A}ms |
| **Latency p90** | ${LATENCY_P90:-N/A}ms |
| **Latency p99** | ${LATENCY_P99:-N/A}ms |
| **Errors** | ${ERRORS:-0} |
| **Timeouts** | ${TIMEOUTS:-0} |
| **Verdict** | 🟢 **${VERDICT}**${REASONS[0]:+ — ${REASONS[*]}} |
EOF

echo "=== Verdict: $VERDICT ${REASONS[*]}"
echo "Results appended to docs/ops/smoke-marketplace-results.md"
