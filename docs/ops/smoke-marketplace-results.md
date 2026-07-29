# Load Smoke — Marketplace GET

- **Task:** P1-18
- **Date:** 2026-07-29
- **Tool:** autocannon
- **Endpoint:** `GET /v1/marketplace`
- **Baseline for:** TM-08 rate abuse, Phase 1 exit criteria

## Configuration

| Parameter | Value |
|---|---|
| Concurrency | 100 |
| Duration | 10s |
| Target URL | `https://digihouse-api-staging.fly.dev/v1/marketplace` |
| Tool | autocannon (via npx) |

## Results

<!-- Each run appends a subsection below via scripts/smoke-marketplace.sh -->

## Interpretation

- **p99 < 1000ms** → ✅ Good. API responds within 1s under 100 concurrent load.
- **Error rate < 1%** → ✅ Acceptable. No systemic failures.
- **Zero 5xx from API logic** → ✅ No crashes. 429 (rate-limit) is acceptable and should be documented.

## Thresholds (from P1-18 AC)

| Metric | Pass | Fail |
|---|---|---|
| p99 latency | < 1000ms | ≥ 1000ms |
| Error rate | < 1% | ≥ 1% |
| API crash (5xx spike) | zero 5xx | any 5xx |
| Connection pool | no timeout spike | timeouts > 5% |

## TM-08 Baseline

This test establishes a baseline for [TM-08 (Rate abuse)](../security/threat-model-v0.md):
- Marketplace GET at 100 concurrent requests
- Recorded throughput and latency before rate limiting (P4-05)
- Future rate-limited runs should show 429s and reduced throughput but zero 5xx

## Next steps

- If any threshold fails, investigate before Phase 1 exit (P1-20).
- Re-run after P4-05 rate limits are added to compare.
