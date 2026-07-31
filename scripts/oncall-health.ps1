# DigiHouse P5-10 - On-call health pull (healthz + marketplace)
# Usage: .\scripts\oncall-health.ps1 [[-BaseUrl] <string>]
# Default URL: production API
# No auth required. Exits 0 if all checks pass, non-zero on failure.
# Cross-ref: docs/ops/on-call-week.md

param(
  [string]$BaseUrl = "https://api.digihouse.app"
)

$ErrorActionPreference = "Stop"
$scriptExitCode = 0

$timestamp = (Get-Date -Format "o")
Write-Host "=== DigiHouse On-Call Health - $timestamp ==="
Write-Host "Target: $BaseUrl"
Write-Host ""

# -- Check 1: /healthz
try {
  $healthz = Invoke-RestMethod -Uri "$BaseUrl/healthz" -Method Get -TimeoutSec 10
  $status = $healthz.status
  $service = $healthz.service
  Write-Host "Healthz  : $status (service=$service)"
  if ($status -ne "ok") {
    Write-Host "  [FAIL] healthz.status is '$status', expected 'ok'" -ForegroundColor Red
    $scriptExitCode = 1
  } else {
    Write-Host "  [PASS]" -ForegroundColor Green
  }
} catch {
  Write-Host "Healthz  : [FAIL] exception - $_" -ForegroundColor Red
  $scriptExitCode = 1
}

# -- Check 2: /v1/marketplace
try {
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  $market = Invoke-RestMethod -Uri "$BaseUrl/v1/marketplace" -Method Get -TimeoutSec 15
  $sw.Stop()
  $count = $market.properties.Count
  $ms = $sw.ElapsedMilliseconds
  Write-Host "Market   : $count properties, ${ms}ms"

  if ($ms -ge 1000) {
    Write-Host "  [WARN] latency ${ms}ms >= 1000ms threshold" -ForegroundColor Yellow
  } else {
    Write-Host "  [PASS]" -ForegroundColor Green
  }
} catch {
  Write-Host "Market   : [FAIL] exception - $_" -ForegroundColor Red
  $scriptExitCode = 1
}

# -- Result
Write-Host ""
if ($scriptExitCode -eq 0) {
  Write-Host "Result   : [PASS]" -ForegroundColor Green
} else {
  Write-Host "Result   : [FAIL] one or more checks failed" -ForegroundColor Red
}

exit $scriptExitCode
