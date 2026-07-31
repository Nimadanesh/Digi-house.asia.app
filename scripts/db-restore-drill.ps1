<#
.SYNOPSIS
  Restore a pg_dump into digihouse_restore_drill and verify row counts.
.DESCRIPTION
  Creates digihouse_restore_drill, restores DUMP, runs SELECT counts on
  properties, users, holdings, earnings — then drops the temp DB unless
  KEEP_DRILL_DB=1.
.PARAMETER DumpFile
  Path to the .dump file (required positional).
.PARAMETER DATABASE_URL
  Connection string for the source Postgres (env var or apps/api/.env).
.EXAMPLE
  $env:DATABASE_URL="postgresql://digihouse:digihouse@localhost:5432/digihouse"
  .\scripts\db-restore-drill.ps1 backups\digihouse-20260730-1500.dump
#>

param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$DumpFile
)

$ErrorActionPreference = "Stop"
$DrillDb = "digihouse_restore_drill"
$DbUrl = $env:DATABASE_URL

# Auto-load from apps/api/.env if not set
if (-not $DbUrl) {
  $ProjectDir = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
  $EnvFile = Join-Path $ProjectDir "apps/api/.env"
  if (Test-Path $EnvFile) {
    $Line = (Get-Content $EnvFile) -match "^DATABASE_URL=" | Select-Object -First 1
    if ($Line) {
      $DbUrl = $Line -replace "^DATABASE_URL=", ""
      Write-Host "Loaded DATABASE_URL from apps/api/.env"
    }
  }
}

if (-not $DbUrl) {
  Write-Host "ERROR: DATABASE_URL is not set"
  exit 1
}

if (-not (Test-Path $DumpFile)) {
  Write-Host "ERROR: Dump file not found: $DumpFile"
  exit 1
}

$MaskedUrl = $DbUrl -replace '://([^:]+):([^@]+)@', '://$1:***@'
$BaseUrl = $DbUrl.Substring(0, $DbUrl.LastIndexOf('/'))
$DrillUrl = "$BaseUrl/$DrillDb"
$AdminUrl = "$BaseUrl/postgres"
$Keep = $env:KEEP_DRILL_DB -eq "1"

function Run-Psql {
  param([string]$Url, [string]$Command)
  $ContainerCheck = docker inspect digihouse-postgres 2>$null
  if ($LASTEXITCODE -eq 0) {
    $Command | docker exec -i digihouse-postgres psql --dbname "$Url" -q -t -A 2>$null
  } else {
    $Command | psql --dbname "$Url" -q -t -A 2>$null
  }
}

Write-Host "=== Restore Drill ==="
Write-Host "Source DB: $MaskedUrl"
Write-Host "Dump file: $DumpFile"
Write-Host "Target DB: $DrillDb"
Write-Host "Keep DB:   $env:KEEP_DRILL_DB"
""

# 1. Drop existing drill DB
Write-Host "--- Dropping existing $DrillDb if present ---"
Run-Psql -Url $AdminUrl -Command "DROP DATABASE IF EXISTS $DrillDb;" 2>$null

# 2. Create drill DB
Write-Host "--- Creating $DrillDb ---"
Run-Psql -Url $AdminUrl -Command "CREATE DATABASE $DrillDb;"

# 3. Restore
Write-Host "--- Restoring into $DrillDb ---"
$ContainerCheck = docker inspect digihouse-postgres 2>$null
if ($LASTEXITCODE -eq 0) {
  Get-Content $DumpFile -Encoding Byte -Raw | docker exec -i digihouse-postgres pg_restore --dbname "$DrillUrl" -Fc 2>&1
} else {
  Get-Content $DumpFile -Encoding Byte -Raw | pg_restore --dbname "$DrillUrl" -Fc 2>&1
}
if ($LASTEXITCODE -ne 0) {
  Write-Host "WARNING: pg_restore reported non-zero exit ($LASTEXITCODE). Continuing verification..."
}

# 4. Verify
Write-Host "--- Verification: row counts ---"
$CountProperties = Run-Psql -Url $DrillUrl -Command "SELECT count(*) FROM properties;"
$CountUsers = Run-Psql -Url $DrillUrl -Command "SELECT count(*) FROM users;"
$CountHoldings = Run-Psql -Url $DrillUrl -Command "SELECT count(*) FROM holdings;"
$CountEarnings = Run-Psql -Url $DrillUrl -Command "SELECT count(*) FROM earnings;"

Write-Host "  properties:  $CountProperties"
Write-Host "  users:       $CountUsers"
Write-Host "  holdings:    $CountHoldings"
Write-Host "  earnings:    $CountEarnings"

# 5. Cleanup
if ($Keep) {
  Write-Host "--- KEEP_DRILL_DB=1 — leaving $DrillDb in place ---"
} else {
  Write-Host "--- Dropping $DrillDb ---"
  Run-Psql -Url $AdminUrl -Command "DROP DATABASE IF EXISTS $DrillDb;"
}

# 6. Exit status
if ($CountProperties -match '^\d+$') {
  ""
  Write-Host "=== Restore drill PASSED ==="
  exit 0
} else {
  ""
  Write-Host "=== Restore drill FAILED ==="
  exit 1
}
